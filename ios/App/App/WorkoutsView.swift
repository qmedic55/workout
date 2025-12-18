import SwiftUI

struct WorkoutsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text("Workouts")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Coming soon: Workout templates and training plans")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding()
                }
                .padding()
            }
            .navigationTitle("Train")
        }
    }
}

#Preview {
    WorkoutsView()
}
