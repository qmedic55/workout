import Foundation

/// A simple networking layer using Swift Concurrency
/// Replace web fetch/axios calls with this native implementation
class NetworkService {
    
    static let shared = NetworkService()
    private let session: URLSession
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.waitsForConnectivity = true
        self.session = URLSession(configuration: configuration)
    }
    
    // MARK: - Request Methods
    
    /// Perform a GET request
    func get<T: Decodable>(
        url: URL,
        headers: [String: String]? = nil
    ) async throws -> T {
        try await request(url: url, method: "GET", headers: headers)
    }
    
    /// Perform a POST request
    func post<T: Decodable, Body: Encodable>(
        url: URL,
        body: Body,
        headers: [String: String]? = nil
    ) async throws -> T {
        try await request(url: url, method: "POST", body: body, headers: headers)
    }
    
    /// Perform a PUT request
    func put<T: Decodable, Body: Encodable>(
        url: URL,
        body: Body,
        headers: [String: String]? = nil
    ) async throws -> T {
        try await request(url: url, method: "PUT", body: body, headers: headers)
    }
    
    /// Perform a DELETE request
    func delete<T: Decodable>(
        url: URL,
        headers: [String: String]? = nil
    ) async throws -> T {
        try await request(url: url, method: "DELETE", headers: headers)
    }
    
    // MARK: - Generic Request
    
    private func request<T: Decodable, Body: Encodable>(
        url: URL,
        method: String,
        body: Body? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        // Add headers
        headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        // Add body if present
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        // Perform request
        let (data, response) = try await session.data(for: request)
        
        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.httpError(statusCode: httpResponse.statusCode)
        }
        
        // Decode response
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
}

// MARK: - Network Errors

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)
    case noData
    
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
        case .noData:
            return "No data received from server"
        }
    }
}

// MARK: - Usage Examples

/*
 
 // 1. Define your models
 struct User: Codable {
     let id: Int
     let name: String
     let email: String
 }
 
 struct CreateUserRequest: Codable {
     let name: String
     let email: String
 }
 
 // 2. Make requests
 
 // GET Request
 func fetchUsers() async throws -> [User] {
     guard let url = URL(string: "https://api.example.com/users") else {
         throw NetworkError.invalidURL
     }
     return try await NetworkService.shared.get(url: url)
 }
 
 // POST Request
 func createUser(name: String, email: String) async throws -> User {
     guard let url = URL(string: "https://api.example.com/users") else {
         throw NetworkError.invalidURL
     }
     
     let requestBody = CreateUserRequest(name: name, email: email)
     return try await NetworkService.shared.post(
         url: url,
         body: requestBody
     )
 }
 
 // 3. Use in SwiftUI
 @MainActor
 class UserViewModel: ObservableObject {
     @Published var users: [User] = []
     @Published var isLoading = false
     @Published var errorMessage: String?
     
     func loadUsers() async {
         isLoading = true
         errorMessage = nil
         
         do {
             users = try await fetchUsers()
         } catch {
             errorMessage = error.localizedDescription
         }
         
         isLoading = false
     }
 }
 
 // 4. Use in UIKit
 class UsersViewController: UIViewController {
     private var users: [User] = []
     
     override func viewDidLoad() {
         super.viewDidLoad()
         loadUsers()
     }
     
     private func loadUsers() {
         Task {
             do {
                 let users = try await fetchUsers()
                 await MainActor.run {
                     self.users = users
                     // Update UI
                 }
             } catch {
                 await MainActor.run {
                     // Show error
                     print("Error: \(error)")
                 }
             }
         }
     }
 }
 
 */
