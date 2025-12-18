import SwiftUI

// MARK: - Binding Helpers for Optional Values
// Add this file to your project to fix "Ambiguous use of 'init()'" errors

extension Binding {
    /// Creates a Binding from an optional value, providing a default when nil
    init(unwrapping binding: Binding<Value?>, default defaultValue: Value) {
        self.init(
            get: { binding.wrappedValue ?? defaultValue },
            set: { newValue in binding.wrappedValue = newValue }
        )
    }
}

extension Binding where Value == String {
    /// Creates a String Binding from an optional String, using empty string as default
    init(optionalString binding: Binding<String?>) {
        self.init(
            get: { binding.wrappedValue ?? "" },
            set: { newValue in binding.wrappedValue = newValue }
        )
    }
}

extension Binding where Value == Bool {
    /// Creates a Bool Binding from an optional Bool, using false as default
    init(optionalBool binding: Binding<Bool?>) {
        self.init(
            get: { binding.wrappedValue ?? false },
            set: { newValue in binding.wrappedValue = newValue }
        )
    }
}

extension Binding where Value == Int {
    /// Creates an Int Binding from an optional Int, with a default value
    init(optionalInt binding: Binding<Int?>, default defaultValue: Int = 0) {
        self.init(
            get: { binding.wrappedValue ?? defaultValue },
            set: { newValue in binding.wrappedValue = newValue }
        )
    }
}

extension Binding where Value == Double {
    /// Creates a Double Binding from an optional Double, with a default value
    init(optionalDouble binding: Binding<Double?>, default defaultValue: Double = 0.0) {
        self.init(
            get: { binding.wrappedValue ?? defaultValue },
            set: { newValue in binding.wrappedValue = newValue }
        )
    }
    
    /// Creates a Double Binding from an optional Int (for sliders)
    init(optionalIntAsDouble binding: Binding<Int?>, default defaultValue: Int = 5) {
        self.init(
            get: { Double(binding.wrappedValue ?? defaultValue) },
            set: { newValue in binding.wrappedValue = Int(newValue) }
        )
    }
}

// MARK: - Usage Examples

/*
 
 Now in your OnboardingView, replace:
 
 // OLD (causes ambiguous init error):
 TextField("First Name", text: Binding(
     get: { data.firstName ?? "" },
     set: { data.firstName = $0 }
 ))
 
 // NEW (clean and clear):
 TextField("First Name", text: Binding(optionalString: $data.firstName))
 
 
 // OLD:
 Toggle("Recently dieting?", isOn: Binding(
     get: { data.recentlyDieting ?? false },
     set: { data.recentlyDieting = $0 }
 ))
 
 // NEW:
 Toggle("Recently dieting?", isOn: Binding(optionalBool: $data.recentlyDieting))
 
 
 // OLD:
 TextField("Age", value: Binding(
     get: { data.age ?? 0 },
     set: { data.age = $0 }
 ), format: .number)
 
 // NEW:
 TextField("Age", value: Binding(optionalInt: $data.age), format: .number)
 
 
 // OLD:
 Slider(value: Binding(
     get: { Double(data.sleepQuality ?? 5) },
     set: { data.sleepQuality = Int($0) }
 ), in: 1...10, step: 1)
 
 // NEW:
 Slider(value: Binding(optionalIntAsDouble: $data.sleepQuality, default: 5), 
        in: 1...10, step: 1)
 
 
 // OLD:
 Picker("Sex", selection: Binding(
     get: { data.sex ?? "male" },
     set: { data.sex = $0 }
 )) { ... }
 
 // NEW:
 Picker("Sex", selection: Binding(unwrapping: $data.sex, default: "male")) { ... }
 
 */
