import SwiftUI

struct OnboardingView: View {
    @Bindable var authViewModel: AuthViewModel
    @State private var currentStep = 1
    @State private var onboardingData = OnboardingData()
    @State private var showingError = false
    
    private let totalSteps = 7
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress Bar
                ProgressView(value: Double(currentStep), total: Double(totalSteps))
                    .tint(.vitalPathPrimary)
                    .padding()
                
                // Step Content
                ScrollView {
                    VStack(spacing: 24) {
                        stepView
                    }
                    .padding()
                }
                
                // Navigation Buttons
                HStack(spacing: 16) {
                    if currentStep > 1 {
                        Button("Back") {
                            withAnimation {
                                currentStep -= 1
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    Spacer()
                    
                    Button(currentStep == totalSteps ? "Complete" : "Next") {
                        if currentStep == totalSteps {
                            submitOnboarding()
                        } else {
                            withAnimation {
                                currentStep += 1
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.vitalPathPrimary)
                    .disabled(authViewModel.isLoading)
                }
                .padding()
                .background(Color(.systemBackground))
            }
            .navigationTitle("Set Up Your Profile")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(authViewModel.errorMessage ?? "An error occurred")
            }
        }
    }
    
    @ViewBuilder
    private var stepView: some View {
        switch currentStep {
        case 1:
            Step1BasicProfile(data: $onboardingData)
        case 2:
            Step2BodyMetrics(data: $onboardingData)
        case 3:
            Step3DietHistory(data: $onboardingData)
        case 4:
            Step4ExerciseBackground(data: $onboardingData)
        case 5:
            Step5Lifestyle(data: $onboardingData)
        case 6:
            Step6BiofeedbackBaseline(data: $onboardingData)
        case 7:
            Step7Preferences(data: $onboardingData)
        default:
            EmptyView()
        }
    }
    
    private func submitOnboarding() {
        Task {
            let success = await authViewModel.submitOnboarding(onboardingData)
            if !success {
                showingError = true
            }
        }
    }
}

// MARK: - Step 1: Basic Profile

struct Step1BasicProfile: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Let's start with the basics")
                .font(.title2)
                .fontWeight(.bold)
            
            TextField("First Name", text: Binding(
                get: { data.firstName ?? "" },
                set: { data.firstName = $0 }
            ))
            .textFieldStyle(.roundedBorder)
            
            TextField("Last Name", text: Binding(
                get: { data.lastName ?? "" },
                set: { data.lastName = $0 }
            ))
            .textFieldStyle(.roundedBorder)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Age")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Age", value: $data.age, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.numberPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Sex")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Picker("Sex", selection: Binding(
                    get: { data.sex ?? "male" },
                    set: { data.sex = $0 }
                )) {
                    Text("Male").tag("male")
                    Text("Female").tag("female")
                }
                .pickerStyle(.segmented)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Height (cm)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Height", value: $data.heightCm, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Current Weight (kg)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Current Weight", value: $data.currentWeightKg, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Target Weight (kg)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Target Weight", value: $data.targetWeightKg, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
        }
    }
}

// MARK: - Step 2: Body Metrics

struct Step2BodyMetrics: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Body Measurements")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("These help us track your progress more accurately")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Waist Circumference (cm)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Waist", value: $data.waistCircumferenceCm, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Hip Circumference (cm)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Hips", value: $data.hipsCircumferenceCm, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Chest Circumference (cm)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Chest", value: $data.chestCircumferenceCm, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Body Fat % (optional)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Body Fat %", value: $data.bodyFatPercentage, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
        }
    }
}

// MARK: - Step 3: Diet History

struct Step3DietHistory: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Your Diet History")
                .font(.title2)
                .fontWeight(.bold)
            
            Toggle("Have you been actively dieting recently?", isOn: Binding(
                get: { data.recentlyDieting ?? false },
                set: { data.recentlyDieting = $0 }
            ))
            
            if data.recentlyDieting == true {
                VStack(alignment: .leading, spacing: 8) {
                    Text("How many months?")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    TextField("Months", value: $data.dietingMonths, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Lowest calorie intake you've tried")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    TextField("Calories", value: $data.lowestCalorieIntake, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Typical daily eating pattern")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("e.g., 3 meals, intermittent fasting...", text: Binding(
                    get: { data.dailyEatingPattern ?? "" },
                    set: { data.dailyEatingPattern = $0 }
                ))
                .textFieldStyle(.roundedBorder)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Biggest hurdles with nutrition")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Describe your challenges...", text: Binding(
                    get: { data.nutritionHurdles ?? "" },
                    set: { data.nutritionHurdles = $0 }
                ), axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Relationship with food")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Picker("Food Relationship", selection: Binding(
                    get: { data.foodRelationship ?? "healthy" },
                    set: { data.foodRelationship = $0 }
                )) {
                    Text("Healthy").tag("healthy")
                    Text("Restrictive").tag("restrictive")
                    Text("Emotional").tag("emotional")
                    Text("Needs Support").tag("needs_support")
                }
                .pickerStyle(.menu)
            }
        }
    }
}

// MARK: - Step 4: Exercise Background

struct Step4ExerciseBackground: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Exercise Background")
                .font(.title2)
                .fontWeight(.bold)
            
            Toggle("Do you do resistance training?", isOn: Binding(
                get: { data.doesResistanceTraining ?? false },
                set: { data.doesResistanceTraining = $0 }
            ))
            
            if data.doesResistanceTraining == true {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Days per week")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    TextField("Days", value: $data.resistanceTrainingDaysPerWeek, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Type of training")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    TextField("e.g., full body, split...", text: Binding(
                        get: { data.resistanceTrainingType ?? "" },
                        set: { data.resistanceTrainingType = $0 }
                    ))
                    .textFieldStyle(.roundedBorder)
                }
            }
            
            Toggle("Do you do cardio?", isOn: Binding(
                get: { data.doesCardio ?? false },
                set: { data.doesCardio = $0 }
            ))
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Average daily steps")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Steps", value: $data.averageDailySteps, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.numberPad)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Physical limitations (optional)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Any injuries or limitations...", text: Binding(
                    get: { data.physicalLimitations ?? "" },
                    set: { data.physicalLimitations = $0 }
                ), axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(2...4)
            }
            
            Toggle("Familiar with RIR (Reps in Reserve)?", isOn: Binding(
                get: { data.familiarWithRIR ?? false },
                set: { data.familiarWithRIR = $0 }
            ))
        }
    }
}

// MARK: - Step 5: Lifestyle

struct Step5Lifestyle: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Lifestyle Factors")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Average sleep hours")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Hours", value: $data.averageSleepHours, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
            }
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Sleep quality: \(data.sleepQuality ?? 5)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Slider(value: Binding(
                    get: { Double(data.sleepQuality ?? 5) },
                    set: { data.sleepQuality = Int($0) }
                ), in: 1...10, step: 1)
                HStack {
                    Text("Poor").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text("Excellent").font(.caption).foregroundStyle(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Stress level: \(data.stressLevel ?? 5)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Slider(value: Binding(
                    get: { Double(data.stressLevel ?? 5) },
                    set: { data.stressLevel = Int($0) }
                ), in: 1...10, step: 1)
                HStack {
                    Text("Low").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text("High").font(.caption).foregroundStyle(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Activity level")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Picker("Activity Level", selection: Binding(
                    get: { data.activityLevel ?? "sedentary" },
                    set: { data.activityLevel = $0 }
                )) {
                    Text("Sedentary").tag("sedentary")
                    Text("Lightly Active").tag("lightly_active")
                    Text("Moderately Active").tag("moderately_active")
                    Text("Very Active").tag("very_active")
                }
                .pickerStyle(.menu)
            }
        }
    }
}

// MARK: - Step 6: Biofeedback Baseline

struct Step6BiofeedbackBaseline: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Biofeedback Baseline")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Morning energy: \(data.morningEnergy ?? 5)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Slider(value: Binding(
                    get: { Double(data.morningEnergy ?? 5) },
                    set: { data.morningEnergy = Int($0) }
                ), in: 1...10, step: 1)
                HStack {
                    Text("Low").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text("High").font(.caption).foregroundStyle(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Afternoon energy: \(data.afternoonEnergy ?? 5)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Slider(value: Binding(
                    get: { Double(data.afternoonEnergy ?? 5) },
                    set: { data.afternoonEnergy = Int($0) }
                ), in: 1...10, step: 1)
                HStack {
                    Text("Low").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text("High").font(.caption).foregroundStyle(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Digestion quality")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Picker("Digestion", selection: Binding(
                    get: { data.digestionQuality ?? "good" },
                    set: { data.digestionQuality = $0 }
                )) {
                    Text("Good").tag("good")
                    Text("Bloating").tag("bloating")
                    Text("Constipation").tag("constipation")
                    Text("Other").tag("other")
                }
                .pickerStyle(.menu)
            }
            
            VStack(alignment: .leading, spacing: 12) {
                Text("General mood: \(data.generalMood ?? 5)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Slider(value: Binding(
                    get: { Double(data.generalMood ?? 5) },
                    set: { data.generalMood = Int($0) }
                ), in: 1...10, step: 1)
                HStack {
                    Text("Low").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text("High").font(.caption).foregroundStyle(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Menstrual status (for women)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Picker("Menstrual Status", selection: Binding(
                    get: { data.menstrualStatus ?? "not_applicable" },
                    set: { data.menstrualStatus = $0 }
                )) {
                    Text("Premenopausal").tag("premenopausal")
                    Text("Perimenopausal").tag("perimenopausal")
                    Text("Postmenopausal").tag("postmenopausal")
                    Text("Not Applicable").tag("not_applicable")
                }
                .pickerStyle(.menu)
            }
        }
    }
}

// MARK: - Step 7: Preferences

struct Step7Preferences: View {
    @Binding var data: OnboardingData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Your Preferences")
                .font(.title2)
                .fontWeight(.bold)
            
            Toggle("Use a wearable device?", isOn: Binding(
                get: { data.usesWearable ?? false },
                set: { data.usesWearable = $0 }
            ))
            
            if data.usesWearable == true {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Which device?")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Picker("Device", selection: Binding(
                        get: { data.wearableDevice ?? "apple_watch" },
                        set: { data.wearableDevice = $0 }
                    )) {
                        Text("Apple Watch").tag("apple_watch")
                        Text("Fitbit").tag("fitbit")
                        Text("Garmin").tag("garmin")
                        Text("Oura").tag("oura")
                        Text("Other").tag("other")
                    }
                    .pickerStyle(.menu)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Coaching tone preference")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Picker("Coaching Tone", selection: Binding(
                    get: { data.coachingTone ?? "empathetic" },
                    set: { data.coachingTone = $0 }
                )) {
                    Text("Empathetic").tag("empathetic")
                    Text("Scientific").tag("scientific")
                    Text("Casual").tag("casual")
                    Text("Tough Love").tag("tough_love")
                }
                .pickerStyle(.menu)
            }
            
            Toggle("Any health conditions?", isOn: Binding(
                get: { data.hasHealthConditions ?? false },
                set: { data.hasHealthConditions = $0 }
            ))
            
            if data.hasHealthConditions == true {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Please describe")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    TextField("Health conditions...", text: Binding(
                        get: { data.healthConditionsNotes ?? "" },
                        set: { data.healthConditionsNotes = $0 }
                    ), axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3...6)
                }
            }
        }
    }
}

#Preview {
    OnboardingView(authViewModel: AuthViewModel())
}
