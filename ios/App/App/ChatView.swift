import SwiftUI

struct ChatView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text("AI Coach")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Coming soon: Chat with your AI health mentor")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding()
                }
                .padding()
            }
            .navigationTitle("Coach")
        }
    }
}

#Preview {
    ChatView()
}
