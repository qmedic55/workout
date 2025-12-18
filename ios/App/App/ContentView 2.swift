import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                if authViewModel.needsOnboarding {
                    OnboardingView(authViewModel: authViewModel)
                } else {
                    MainTabView()
                        .environment(authViewModel)
                }
            } else {
                LandingView(authViewModel: authViewModel)
            }
        }
        .task {
            await authViewModel.checkAuthStatus()
        }
    }
}

#Preview {
    ContentView()
}
