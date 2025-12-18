import SwiftUI

struct NutritionView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text("Nutrition Tracker")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Coming soon: Food tracking and meal logging")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding()
                }
                .padding()
            }
            .navigationTitle("Food")
        }
    }
}

#Preview {
    NutritionView()
}
