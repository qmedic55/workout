import SwiftUI

// MARK: - App Colors

extension Color {
    // Primary
    static let vitalPathPrimary = Color(hex: "6366F1") // Indigo
    
    // Phase Colors
    static let phaseAssessment = Color.gray
    static let phaseRecovery = Color(hex: "22C55E") // Green
    static let phaseRecomp = Color(hex: "3B82F6") // Blue
    static let phaseCutting = Color(hex: "F97316") // Orange
    
    // Insight Colors
    static let insightWarning = Color(hex: "F59E0B") // Amber
    static let insightPositive = Color(hex: "22C55E") // Green
    static let insightSuggestion = Color(hex: "3B82F6") // Blue
    
    // Helper for hex colors
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Phase Extensions

extension String {
    var phaseColor: Color {
        switch self.lowercased() {
        case "assessment":
            return .phaseAssessment
        case "recovery":
            return .phaseRecovery
        case "recomp":
            return .phaseRecomp
        case "cutting":
            return .phaseCutting
        default:
            return .gray
        }
    }
    
    var phaseDisplayName: String {
        switch self.lowercased() {
        case "assessment":
            return "Assessment"
        case "recovery":
            return "Metabolic Recovery"
        case "recomp":
            return "Body Recomposition"
        case "cutting":
            return "Fat Loss Phase"
        default:
            return self.capitalized
        }
    }
}

extension HealthInsight {
    var color: Color {
        switch type.lowercased() {
        case "warning":
            return .insightWarning
        case "positive":
            return .insightPositive
        case "suggestion":
            return .insightSuggestion
        default:
            return .blue
        }
    }
    
    var icon: String {
        switch type.lowercased() {
        case "warning":
            return "exclamationmark.triangle.fill"
        case "positive":
            return "checkmark.circle.fill"
        case "suggestion":
            return "lightbulb.fill"
        default:
            return "info.circle.fill"
        }
    }
}

// MARK: - Date Formatting

extension Date {
    func toYYYYMMDD() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: self)
    }
    
    static func from(yyyyMMdd: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: yyyyMMdd)
    }
    
    var timeBasedGreeting: String {
        let hour = Calendar.current.component(.hour, from: self)
        switch hour {
        case 0..<12:
            return "Good morning"
        case 12..<17:
            return "Good afternoon"
        default:
            return "Good evening"
        }
    }
}

// MARK: - Meal Type Extensions

extension String {
    var mealTypeDisplayName: String {
        switch self.lowercased() {
        case "breakfast":
            return "Breakfast"
        case "lunch":
            return "Lunch"
        case "dinner":
            return "Dinner"
        case "snack":
            return "Snack"
        default:
            return self.capitalized
        }
    }
    
    var mealTypeIcon: String {
        switch self.lowercased() {
        case "breakfast":
            return "sunrise.fill"
        case "lunch":
            return "sun.max.fill"
        case "dinner":
            return "moon.stars.fill"
        case "snack":
            return "leaf.fill"
        default:
            return "fork.knife"
        }
    }
}

// MARK: - Workout Type Extensions

extension WorkoutTemplate {
    var typeColor: Color {
        switch type.lowercased() {
        case "strength":
            return .blue
        case "cardio":
            return .red
        case "flexibility":
            return .green
        case "recovery":
            return .purple
        default:
            return .gray
        }
    }
    
    var typeIcon: String {
        switch type.lowercased() {
        case "strength":
            return "dumbbell.fill"
        case "cardio":
            return "heart.fill"
        case "flexibility":
            return "figure.yoga"
        case "recovery":
            return "bed.double.fill"
        default:
            return "figure.walk"
        }
    }
    
    var difficultyColor: Color {
        switch difficulty.lowercased() {
        case "beginner":
            return .green
        case "intermediate":
            return .orange
        case "advanced":
            return .red
        default:
            return .gray
        }
    }
}

// MARK: - Coaching Tone

extension String {
    var coachingToneDisplayName: String {
        switch self.lowercased() {
        case "empathetic":
            return "Empathetic & Supportive"
        case "scientific":
            return "Scientific & Data-Driven"
        case "casual":
            return "Casual & Friendly"
        case "tough_love":
            return "Tough Love"
        default:
            return self.capitalized
        }
    }
}

// MARK: - Number Formatters

extension Double {
    func formatted(decimalPlaces: Int = 1) -> String {
        String(format: "%.\(decimalPlaces)f", self)
    }
}

extension Int {
    var formatted: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: self)) ?? "\(self)"
    }
}
