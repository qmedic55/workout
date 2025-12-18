import SwiftUI

struct ProfileView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    
    var body: some View {
        NavigationStack {
            List {
                if let profile = authViewModel.userProfile {
                    Section {
                        HStack {
                            // Avatar with initials
                            ZStack {
                                Circle()
                                    .fill(Color.vitalPathPrimary)
                                    .frame(width: 60, height: 60)
                                
                                Text(profile.initials)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(profile.fullName)
                                    .font(.headline)
                                
                                if let age = profile.age {
                                    Text("\(age) years old")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.leading, 8)
                        }
                        .padding(.vertical, 8)
                    }
                    
                    Section("Current Stats") {
                        if let weight = profile.currentWeightKg {
                            LabeledContent("Weight", value: "\(weight.formatted(decimalPlaces: 1)) kg")
                        }
                        if let target = profile.targetWeightKg {
                            LabeledContent("Target", value: "\(target.formatted(decimalPlaces: 1)) kg")
                        }
                        if let height = profile.heightCm {
                            LabeledContent("Height", value: "\(height.formatted(decimalPlaces: 0)) cm")
                        }
                        if let bodyFat = profile.bodyFatPercentage {
                            LabeledContent("Body Fat", value: "\(bodyFat.formatted(decimalPlaces: 1))%")
                        }
                    }
                    
                    Section("Goals") {
                        if let calories = profile.targetCalories {
                            LabeledContent("Calories", value: "\(calories) kcal")
                        }
                        if let protein = profile.proteinGrams {
                            LabeledContent("Protein", value: "\(protein)g")
                        }
                        if let carbs = profile.carbsGrams {
                            LabeledContent("Carbs", value: "\(carbs)g")
                        }
                        if let fat = profile.fatGrams {
                            LabeledContent("Fat", value: "\(fat)g")
                        }
                        if let steps = profile.dailyStepsTarget {
                            LabeledContent("Daily Steps", value: "\(steps.formatted)")
                        }
                    }
                    
                    Section("Phase") {
                        if let phase = profile.currentPhase {
                            HStack {
                                Text(phase.phaseDisplayName)
                                Spacer()
                                Circle()
                                    .fill(phase.phaseColor)
                                    .frame(width: 12, height: 12)
                            }
                        }
                    }
                    
                    Section {
                        NavigationLink {
                            SettingsView()
                        } label: {
                            Label("Settings", systemImage: "gear")
                        }
                        
                        Button(role: .destructive) {
                            authViewModel.signOut()
                        } label: {
                            Label("Sign Out", systemImage: "arrow.right.square")
                        }
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct SettingsView: View {
    var body: some View {
        List {
            Section("Coming Soon") {
                Text("Profile editing")
                Text("Preferences")
                Text("Data export")
            }
        }
        .navigationTitle("Settings")
    }
}

#Preview {
    ProfileView()
        .environment(AuthViewModel())
}
