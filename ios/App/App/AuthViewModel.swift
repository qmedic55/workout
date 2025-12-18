import Foundation
import AuthenticationServices

@Observable
@MainActor
class AuthViewModel {
    var isAuthenticated = false
    var needsOnboarding = false
    var currentUser: APIClient.AuthUser?
    var userProfile: UserProfile?
    var errorMessage: String?
    var isLoading = false
    
    private let apiClient = APIClient.shared
    
    func checkAuthStatus() async {
        if apiClient.isAuthenticated {
            await loadProfile()
        }
    }
    
    func signInWithApple(authorization: ASAuthorization) async {
        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            errorMessage = "Failed to get Apple ID credential"
            return
        }
        
        guard let identityTokenData = appleIDCredential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            errorMessage = "Failed to get identity token"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let user = try await apiClient.signInWithApple(
                identityToken: identityToken,
                email: appleIDCredential.email,
                givenName: appleIDCredential.fullName?.givenName,
                familyName: appleIDCredential.fullName?.familyName,
                userIdentifier: appleIDCredential.user
            )
            
            currentUser = user
            isAuthenticated = true
            
            // Load profile to check onboarding status
            await loadProfile()
            
        } catch {
            errorMessage = "Sign in failed: \(error.localizedDescription)"
            isAuthenticated = false
        }
        
        isLoading = false
    }
    
    func loadProfile() async {
        do {
            let profile = try await apiClient.getProfile()
            userProfile = profile
            needsOnboarding = !(profile.onboardingCompleted ?? false)
            isAuthenticated = true
        } catch {
            errorMessage = "Failed to load profile: \(error.localizedDescription)"
            isAuthenticated = false
        }
    }
    
    func submitOnboarding(_ data: OnboardingData) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let profile = try await apiClient.submitOnboarding(data)
            userProfile = profile
            needsOnboarding = false
            isLoading = false
            return true
        } catch {
            errorMessage = "Onboarding failed: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }
    
    func signOut() {
        apiClient.clearSession()
        isAuthenticated = false
        needsOnboarding = false
        currentUser = nil
        userProfile = nil
    }
}
