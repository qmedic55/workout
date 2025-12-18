import Foundation

// MARK: - User Profile

struct UserProfile: Codable, Identifiable {
    let id: String
    let userId: String
    var firstName: String?
    var lastName: String?
    var age: Int?
    var sex: String? // "male" or "female"
    var heightCm: Double?
    var currentWeightKg: Double?
    var targetWeightKg: Double?
    var bodyFatPercentage: Double?
    var waistCircumferenceCm: Double?
    var currentPhase: String? // "assessment", "recovery", "recomp", "cutting"
    var phaseStartDate: String?
    var maintenanceCalories: Int?
    var targetCalories: Int?
    var proteinGrams: Int?
    var carbsGrams: Int?
    var fatGrams: Int?
    var dailyStepsTarget: Int?
    var coachingTone: String? // "empathetic", "scientific", "casual", "tough_love"
    var hasHealthConditions: Bool?
    var healthConditionsNotes: String?
    var onboardingCompleted: Bool?
    
    var fullName: String {
        [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    }
    
    var initials: String {
        let first = firstName?.first.map(String.init) ?? ""
        let last = lastName?.first.map(String.init) ?? ""
        return first + last
    }
}

// MARK: - Daily Log

struct DailyLog: Codable, Identifiable {
    let id: String
    let userId: String
    let logDate: String // YYYY-MM-DD
    var weightKg: Double?
    var waistCm: Double?
    var hipsCm: Double?
    var chestCm: Double?
    var caloriesConsumed: Int?
    var proteinGrams: Double?
    var carbsGrams: Double?
    var fatGrams: Double?
    var waterLiters: Double?
    var steps: Int?
    var activeMinutes: Int?
    var workoutCompleted: Bool?
    var workoutType: String?
    var workoutDurationMinutes: Int?
    var sleepHours: Double?
    var sleepQuality: Int? // 1-10
    var energyLevel: Int? // 1-10
    var stressLevel: Int? // 1-10
    var moodRating: Int? // 1-10
    var notes: String?
    var avgHeartRate: Int?
    var hrv: Double?
}

// MARK: - Food Entry

struct FoodEntry: Codable, Identifiable {
    let id: String
    let userId: String
    let logDate: String
    let mealType: String // "breakfast", "lunch", "dinner", "snack"
    let foodName: String
    var servingSize: String?
    var servingQuantity: Double?
    var calories: Int?
    var proteinGrams: Double?
    var carbsGrams: Double?
    var fatGrams: Double?
}

// MARK: - Food Item (Search Result)

struct FoodItem: Codable, Identifiable {
    let id: String
    let name: String
    let servingSize: String?
    let calories: Int?
    let proteinGrams: Double?
    let carbsGrams: Double?
    let fatGrams: Double?
}

// MARK: - Chat Message

struct ChatMessage: Codable, Identifiable {
    let id: String
    let userId: String
    let role: String // "user" or "assistant"
    let content: String
    let createdAt: String
    
    var isUser: Bool {
        role == "user"
    }
    
    var timestamp: Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: createdAt)
    }
}

// MARK: - Health Insight

struct HealthInsight: Codable, Identifiable {
    let id: String
    let type: String // "warning", "positive", "suggestion"
    let category: String // "sleep", "nutrition", "stress", "training", "hydration", "phase"
    let title: String
    let message: String
    var actionUrl: String?
    let priority: Int
}

// MARK: - Workout Template

struct WorkoutTemplate: Codable, Identifiable {
    let id: String
    let name: String
    var description: String?
    let type: String // "strength", "cardio", "flexibility", "recovery"
    let difficulty: String // "beginner", "intermediate", "advanced"
    var durationMinutes: Int?
    var exercises: [Exercise]?
}

struct Exercise: Codable, Identifiable {
    var id: String { name }
    let name: String
    var sets: Int?
    var reps: String? // e.g., "8-12"
    var rir: Int? // Reps in Reserve
    var notes: String?
}

// MARK: - Educational Article

struct Article: Codable, Identifiable {
    let id: String
    let title: String
    let slug: String
    let category: String
    let content: String // Markdown
    var readTimeMinutes: Int?
}

// MARK: - Onboarding Data

struct OnboardingData: Codable {
    // Step 1: Basic Profile
    var firstName: String?
    var lastName: String?
    var age: Int?
    var sex: String?
    var heightCm: Double?
    var currentWeightKg: Double?
    var targetWeightKg: Double?
    
    // Step 2: Body Metrics
    var waistCircumferenceCm: Double?
    var hipsCircumferenceCm: Double?
    var chestCircumferenceCm: Double?
    var bodyFatPercentage: Double?
    
    // Step 3: Diet History
    var recentlyDieting: Bool?
    var dietingMonths: Int?
    var lowestCalorieIntake: Int?
    var dailyEatingPattern: String?
    var nutritionHurdles: String?
    var foodRelationship: String?
    
    // Step 4: Exercise Background
    var doesResistanceTraining: Bool?
    var resistanceTrainingDaysPerWeek: Int?
    var resistanceTrainingType: String?
    var doesCardio: Bool?
    var averageDailySteps: Int?
    var physicalLimitations: String?
    var familiarWithRIR: Bool?
    
    // Step 5: Lifestyle
    var averageSleepHours: Double?
    var sleepQuality: Int?
    var stressLevel: Int?
    var activityLevel: String?
    
    // Step 6: Biofeedback Baseline
    var morningEnergy: Int?
    var afternoonEnergy: Int?
    var digestionQuality: String?
    var generalMood: Int?
    var menstrualStatus: String?
    
    // Step 7: Preferences
    var usesWearable: Bool?
    var wearableDevice: String?
    var coachingTone: String?
    var hasHealthConditions: Bool?
    var healthConditionsNotes: String?
}
