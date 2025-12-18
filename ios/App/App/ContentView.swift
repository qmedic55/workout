import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = MainViewModel()
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Welcome to Your Native iOS App")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
                    .padding()
                
                Text("This is now a native iOS app built with SwiftUI")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Button(action: {
                    viewModel.handleAction()
                }) {
                    Label("Get Started", systemImage: "arrow.right.circle.fill")
                        .font(.headline)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Home")
        }
    }
}

@MainActor
class MainViewModel: ObservableObject {
    @Published var isLoading = false
    
    func handleAction() {
        isLoading = true
        // Add your app logic here
        print("Action triggered")
        
        Task {
            // Simulate async work
            try? await Task.sleep(for: .seconds(1))
            isLoading = false
        }
    }
}

#Preview {
    ContentView()
}
