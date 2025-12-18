# Quick Fix for "Ambiguous use of 'init()'" Error

## Problem
The error occurs in `OnboardingView.swift` because Swift's type inference struggles with the `Binding` initializer when using shorthand closure syntax (`$0`).

## Solution
Replace all `Binding` initializers to use explicit closure parameter names.

## Find & Replace Pattern

**Find:**
```swift
Binding(
    get: { data.PROPERTY ?? DEFAULT },
    set: { data.PROPERTY = $0 }
)
```

**Replace with:**
```swift
Binding(
    get: { data.PROPERTY ?? DEFAULT },
    set: { newValue in data.PROPERTY = newValue }
)
```

## Specific Fixes

### 1. String Bindings
**Before:**
```swift
TextField("First Name", text: Binding(
    get: { data.firstName ?? "" },
    set: { data.firstName = $0 }
))
```

**After:**
```swift
TextField("First Name", text: Binding(
    get: { data.firstName ?? "" },
    set: { newValue in data.firstName = newValue }
))
```

### 2. Bool Bindings (Toggle)
**Before:**
```swift
Toggle("Use a wearable device?", isOn: Binding(
    get: { data.usesWearable ?? false },
    set: { data.usesWearable = $0 }
))
```

**After:**
```swift
Toggle("Use a wearable device?", isOn: Binding(
    get: { data.usesWearable ?? false },
    set: { newValue in data.usesWearable = newValue }
))
```

### 3. Number Bindings (Slider)
**Before:**
```swift
Slider(value: Binding(
    get: { Double(data.sleepQuality ?? 5) },
    set: { data.sleepQuality = Int($0) }
), in: 1...10, step: 1)
```

**After:**
```swift
Slider(value: Binding(
    get: { Double(data.sleepQuality ?? 5) },
    set: { newValue in data.sleepQuality = Int(newValue) }
), in: 1...10, step: 1)
```

### 4. Picker Bindings
**Before:**
```swift
Picker("Sex", selection: Binding(
    get: { data.sex ?? "male" },
    set: { data.sex = $0 }
)) {
    Text("Male").tag("male")
    Text("Female").tag("female")
}
```

**After:**
```swift
Picker("Sex", selection: Binding(
    get: { data.sex ?? "male" },
    set: { newValue in data.sex = newValue }
)) {
    Text("Male").tag("male")
    Text("Female").tag("female")
}
```

## Quick Fix Using Xcode

1. Open `OnboardingView.swift`
2. Use Find & Replace (Cmd + Option + F)
3. Enable "Regular Expression" mode
4. **Find:** `set: \{ ([^.]+)\.([a-zA-Z]+) = \$0 \}`
5. **Replace:** `set: { newValue in $1.$2 = newValue }`
6. Click "Replace All"

**For Int conversions:**
7. **Find:** `set: \{ ([^.]+)\.([a-zA-Z]+) = Int\(\$0\) \}`
8. **Replace:** `set: { newValue in $1.$2 = Int(newValue) }`
9. Click "Replace All"

## Verify Fix

After making changes:
1. Build project (Cmd + B)
2. All errors should be resolved
3. Test onboarding flow in simulator

## Alternative: Use Computed Properties

If the regex is intimidating, you can create helper computed properties in `OnboardingData`:

```swift
struct OnboardingData: Codable {
    var firstName: String?
    
    var firstNameBinding: String {
        get { firstName ?? "" }
        set { firstName = newValue }
    }
    
    // Repeat for each property...
}
```

Then use:
```swift
TextField("First Name", text: $data.firstNameBinding)
```

But this requires many more code changes. The regex fix is faster!

---

Need help? I can create the fully corrected OnboardingView.swift file for you.
