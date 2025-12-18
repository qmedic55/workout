import SwiftUI
import AuthenticationServices

struct LandingView: View {
    @Bindable var authViewModel: AuthViewModel
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                Spacer()
                    .frame(height: 40)
                
                // Logo and Title
                VStack(spacing: 16) {
                    Image(systemName: "heart.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.vitalPathPrimary)
                    
                    Text("VitalPath")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundStyle(.primary)
                }
                
                // Headline
                VStack(spacing: 12) {
                    Text("Your Holistic Health Journey Starts Here")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.center)
                    
                    Text("AI-powered coaching for body recomposition and metabolic recovery, designed specifically for adults 40 and beyond.")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                // Sign in with Apple Button
                SignInWithAppleButton(.signIn) { request in
                    request.requestedScopes = [.fullName, .email]
                } onCompletion: { result in
                    switch result {
                    case .success(let authorization):
                        Task {
                            await authViewModel.signInWithApple(authorization: authorization)
                        }
                    case .failure(let error):
                        authViewModel.errorMessage = error.localizedDescription
                    }
                }
                .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                .frame(height: 50)
                .padding(.horizontal, 32)
                .padding(.top, 16)
                
                if authViewModel.isLoading {
                    ProgressView()
                        .padding()
                }
                
                if let errorMessage = authViewModel.errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                // Feature Cards
                VStack(spacing: 20) {
                    FeatureCard(
                        icon: "brain.head.profile",
                        title: "AI Mentor",
                        description: "Personalized guidance from an AI coach trained in metabolic science"
                    )
                    
                    FeatureCard(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "Track Everything",
                        description: "Log nutrition, workouts, sleep, stress, and biometrics in one place"
                    )
                    
                    FeatureCard(
                        icon: "sparkles",
                        title: "Smart Insights",
                        description: "Connect wearables and get data-driven recommendations"
                    )
                }
                .padding(.horizontal)
                .padding(.top, 20)
                
                Spacer()
                    .frame(height: 40)
            }
        }
        .background(Color(.systemBackground))
    }
}

struct FeatureCard: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundStyle(.vitalPathPrimary)
                .frame(width: 50)
            
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

#Preview {
    LandingView(authViewModel: AuthViewModel())
}
