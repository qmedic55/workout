import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home
            DashboardView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            // Food
            NutritionView()
                .tabItem {
                    Label("Food", systemImage: "fork.knife")
                }
                .tag(1)
            
            // Coach
            ChatView()
                .tabItem {
                    Label("Coach", systemImage: "message.fill")
                }
                .tag(2)
            
            // Train
            WorkoutsView()
                .tabItem {
                    Label("Train", systemImage: "dumbbell.fill")
                }
                .tag(3)
            
            // Profile
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(.vitalPathPrimary)
    }
}

#Preview {
    MainTabView()
        .environment(AuthViewModel())
}
