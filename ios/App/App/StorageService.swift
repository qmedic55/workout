import Foundation

/// A type-safe wrapper around UserDefaults for persisting simple data
/// Replaces localStorage/sessionStorage from web apps
@propertyWrapper
struct UserDefault<T: Codable> {
    let key: String
    let defaultValue: T
    
    var wrappedValue: T {
        get {
            guard let data = UserDefaults.standard.data(forKey: key) else {
                return defaultValue
            }
            let value = try? JSONDecoder().decode(T.self, from: data)
            return value ?? defaultValue
        }
        set {
            let data = try? JSONEncoder().encode(newValue)
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

/// A simple storage manager for common app data
class StorageService {
    static let shared = StorageService()
    private let defaults = UserDefaults.standard
    
    private init() {}
    
    // MARK: - Generic Save/Load
    
    /// Save any Codable value
    func save<T: Codable>(_ value: T, forKey key: String) throws {
        let data = try JSONEncoder().encode(value)
        defaults.set(data, forKey: key)
    }
    
    /// Load any Codable value
    func load<T: Codable>(forKey key: String) throws -> T? {
        guard let data = defaults.data(forKey: key) else {
            return nil
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    /// Remove value for key
    func remove(forKey key: String) {
        defaults.removeObject(forKey: key)
    }
    
    /// Check if key exists
    func exists(forKey key: String) -> Bool {
        return defaults.object(forKey: key) != nil
    }
    
    /// Clear all stored data
    func clearAll() {
        if let bundleID = Bundle.main.bundleIdentifier {
            defaults.removePersistentDomain(forName: bundleID)
        }
    }
    
    // MARK: - Convenience Methods for Primitives
    
    func saveString(_ value: String, forKey key: String) {
        defaults.set(value, forKey: key)
    }
    
    func loadString(forKey key: String) -> String? {
        return defaults.string(forKey: key)
    }
    
    func saveInt(_ value: Int, forKey key: String) {
        defaults.set(value, forKey: key)
    }
    
    func loadInt(forKey key: String) -> Int {
        return defaults.integer(forKey: key)
    }
    
    func saveBool(_ value: Bool, forKey key: String) {
        defaults.set(value, forKey: key)
    }
    
    func loadBool(forKey key: String) -> Bool {
        return defaults.bool(forKey: key)
    }
}

// MARK: - Secure Storage (for sensitive data like tokens)

import Security

/// Keychain wrapper for storing sensitive data
/// Use this instead of UserDefaults for passwords, tokens, etc.
class KeychainService {
    static let shared = KeychainService()
    private init() {}
    
    /// Save string to Keychain
    func save(_ value: String, forKey key: String) throws {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        // Delete any existing item
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }
    
    /// Load string from Keychain
    func load(forKey key: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw KeychainError.loadFailed(status)
        }
        
        guard let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.invalidData
        }
        
        return string
    }
    
    /// Delete item from Keychain
    func delete(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

enum KeychainError: LocalizedError {
    case saveFailed(OSStatus)
    case loadFailed(OSStatus)
    case deleteFailed(OSStatus)
    case invalidData
    
    var errorDescription: String? {
        switch self {
        case .saveFailed(let status):
            return "Failed to save to Keychain: \(status)"
        case .loadFailed(let status):
            return "Failed to load from Keychain: \(status)"
        case .deleteFailed(let status):
            return "Failed to delete from Keychain: \(status)"
        case .invalidData:
            return "Invalid data format"
        }
    }
}

// MARK: - Usage Examples

/*
 
 // 1. Using @UserDefault property wrapper
 class AppSettings {
     @UserDefault(key: "username", defaultValue: "")
     static var username: String
     
     @UserDefault(key: "isFirstLaunch", defaultValue: true)
     static var isFirstLaunch: Bool
     
     @UserDefault(key: "theme", defaultValue: Theme.light)
     static var theme: Theme
 }
 
 enum Theme: String, Codable {
     case light, dark
 }
 
 // Usage:
 AppSettings.username = "john"
 print(AppSettings.username) // "john"
 
 
 // 2. Using StorageService for complex objects
 struct User: Codable {
     let id: Int
     let name: String
     let email: String
 }
 
 // Save
 let user = User(id: 1, name: "John", email: "john@example.com")
 try? StorageService.shared.save(user, forKey: "currentUser")
 
 // Load
 if let savedUser: User = try? StorageService.shared.load(forKey: "currentUser") {
     print(savedUser.name)
 }
 
 // Remove
 StorageService.shared.remove(forKey: "currentUser")
 
 
 // 3. Using KeychainService for sensitive data (tokens, passwords)
 
 // Save token
 try? KeychainService.shared.save("your-auth-token", forKey: "authToken")
 
 // Load token
 if let token = try? KeychainService.shared.load(forKey: "authToken") {
     print("Token: \(token)")
 }
 
 // Delete token (on logout)
 try? KeychainService.shared.delete(forKey: "authToken")
 
 
 // 4. Migration from web localStorage to native
 
 // Web (JavaScript):
 // localStorage.setItem('username', 'john');
 // const username = localStorage.getItem('username');
 // localStorage.removeItem('username');
 
 // Native (Swift):
 StorageService.shared.saveString("john", forKey: "username")
 let username = StorageService.shared.loadString(forKey: "username")
 StorageService.shared.remove(forKey: "username")
 
 
 // 5. Using in SwiftUI
 @MainActor
 class SettingsViewModel: ObservableObject {
     @Published var username: String {
         didSet {
             StorageService.shared.saveString(username, forKey: "username")
         }
     }
     
     init() {
         self.username = StorageService.shared.loadString(forKey: "username") ?? ""
     }
 }
 
 */
