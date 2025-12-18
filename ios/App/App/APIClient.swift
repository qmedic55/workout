import Foundation

/// API Client for VitalPath backend
/// Handles authentication, requests, and cookie management
@Observable
class APIClient {
    static let shared = APIClient()
    
    private let baseURL = "https://health-mentor-ai--ikugelman.replit.app"
    private let session: URLSession
    private var sessionCookie: String?
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.waitsForConnectivity = true
        configuration.httpCookieStorage = HTTPCookieStorage.shared
        configuration.httpCookieAcceptPolicy = .always
        self.session = URLSession(configuration: configuration)
    }
    
    // MARK: - Session Management
    
    func setSession(_ cookie: String) {
        self.sessionCookie = cookie
        
        // Store cookie in HTTPCookieStorage
        if let url = URL(string: baseURL),
           let httpCookie = HTTPCookie(properties: [
            .domain: url.host ?? "",
            .path: "/",
            .name: "__session",
            .value: cookie,
            .secure: true,
            .expires: Date().addingTimeInterval(30 * 24 * 60 * 60) // 30 days
           ]) {
            HTTPCookieStorage.shared.setCookie(httpCookie)
        }
    }
    
    func clearSession() {
        sessionCookie = nil
        if let cookies = HTTPCookieStorage.shared.cookies {
            for cookie in cookies {
                HTTPCookieStorage.shared.deleteCookie(cookie)
            }
        }
    }
    
    var isAuthenticated: Bool {
        sessionCookie != nil || hasStoredCookie()
    }
    
    private func hasStoredCookie() -> Bool {
        guard let url = URL(string: baseURL),
              let cookies = HTTPCookieStorage.shared.cookies(for: url) else {
            return false
        }
        return cookies.contains { $0.name == "__session" }
    }
    
    // MARK: - Generic Request Method
    
    func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add body if present
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        // Perform request
        let (data, response) = try await session.data(for: request)
        
        // Extract and store session cookie if present
        if let httpResponse = response as? HTTPURLResponse,
           let cookies = HTTPCookie.cookies(withResponseHeaderFields: httpResponse.allHeaderFields as! [String: String], for: url) {
            for cookie in cookies where cookie.name == "__session" {
                setSession(cookie.value)
            }
        }
        
        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        // Decode response
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    // MARK: - Authentication
    
    struct AppleSignInRequest: Codable {
        let identityToken: String
        let email: String?
        let givenName: String?
        let familyName: String?
        let user: String
    }
    
    struct AuthResponse: Codable {
        let success: Bool
        let user: AuthUser
    }
    
    struct AuthUser: Codable {
        let id: String
        let email: String?
        let firstName: String?
        let lastName: String?
    }
    
    func signInWithApple(
        identityToken: String,
        email: String?,
        givenName: String?,
        familyName: String?,
        userIdentifier: String
    ) async throws -> AuthUser {
        let requestBody = AppleSignInRequest(
            identityToken: identityToken,
            email: email,
            givenName: givenName,
            familyName: familyName,
            user: userIdentifier
        )
        
        let response: AuthResponse = try await request("/api/auth/apple", method: "POST", body: requestBody)
        return response.user
    }
    
    // MARK: - Profile
    
    func getProfile() async throws -> UserProfile {
        try await request("/api/profile")
    }
    
    func updateProfile(_ updates: UserProfile) async throws -> UserProfile {
        try await request("/api/profile", method: "PATCH", body: updates)
    }
    
    func submitOnboarding(_ data: OnboardingData) async throws -> UserProfile {
        struct OnboardingResponse: Codable {
            let success: Bool
            let profile: UserProfile
        }
        let response: OnboardingResponse = try await request("/api/onboarding", method: "POST", body: data)
        return response.profile
    }
    
    // MARK: - Daily Logs
    
    func getDailyLogs() async throws -> [DailyLog] {
        try await request("/api/daily-logs")
    }
    
    func getTodayLog() async throws -> DailyLog? {
        try await request("/api/daily-logs/today")
    }
    
    func getLogForDate(_ date: String) async throws -> DailyLog? {
        try await request("/api/daily-logs/\(date)")
    }
    
    func getLogsForRange(_ days: Int) async throws -> [DailyLog] {
        try await request("/api/daily-logs/range/\(days)")
    }
    
    func createDailyLog(_ log: DailyLog) async throws -> DailyLog {
        try await request("/api/daily-logs", method: "POST", body: log)
    }
    
    // MARK: - Food Tracking
    
    func searchFoods(query: String) async throws -> [FoodItem] {
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        return try await request("/api/foods?q=\(encodedQuery)")
    }
    
    func getFoodEntries(date: String) async throws -> [FoodEntry] {
        try await request("/api/food-entries/\(date)")
    }
    
    func createFoodEntry(_ entry: FoodEntry) async throws -> FoodEntry {
        try await request("/api/food-entries", method: "POST", body: entry)
    }
    
    func deleteFoodEntry(id: String) async throws {
        struct DeleteResponse: Codable {
            let success: Bool
        }
        let _: DeleteResponse = try await request("/api/food-entries/\(id)", method: "DELETE")
    }
    
    // MARK: - AI Chat
    
    func getChatMessages() async throws -> [ChatMessage] {
        try await request("/api/chat/messages")
    }
    
    struct SendMessageRequest: Codable {
        let content: String
    }
    
    struct ChatResponse: Codable {
        let userMessage: ChatMessage
        let assistantMessage: ChatMessage
    }
    
    func sendChatMessage(_ content: String) async throws -> ChatResponse {
        let request = SendMessageRequest(content: content)
        return try await self.request("/api/chat/send", method: "POST", body: request)
    }
    
    // MARK: - Health Insights
    
    func getInsights() async throws -> [HealthInsight] {
        try await request("/api/insights")
    }
    
    // MARK: - Workouts
    
    func getWorkouts() async throws -> [WorkoutTemplate] {
        try await request("/api/workouts")
    }
    
    // MARK: - Educational Content
    
    func getArticles() async throws -> [Article] {
        try await request("/api/educational-content")
    }
    
    // MARK: - Data Export
    
    func exportAsJSON() async throws -> Data {
        guard let url = URL(string: baseURL + "/api/export/json") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let (data, _) = try await session.data(for: request)
        return data
    }
    
    func exportAsCSV() async throws -> Data {
        guard let url = URL(string: baseURL + "/api/export/csv") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let (data, _) = try await session.data(for: request)
        return data
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The URL is invalid"
        case .invalidResponse:
            return "The server response was invalid"
        case .httpError(let statusCode):
            return "HTTP Error: \(statusCode)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .unauthorized:
            return "You need to sign in"
        }
    }
}
