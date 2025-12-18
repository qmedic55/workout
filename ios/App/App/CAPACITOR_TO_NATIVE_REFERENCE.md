# Capacitor Plugin → Native iOS API Reference

This guide shows how to replace common Capacitor plugins with native iOS APIs.

## 📸 Camera / Photo Library

### Capacitor Plugin
```typescript
import { Camera } from '@capacitor/camera';

const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri
});
```

### Native iOS (SwiftUI)
```swift
import PhotosUI
import SwiftUI

struct PhotoPickerExample: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: Image?
    
    var body: some View {
        VStack {
            if let selectedImage {
                selectedImage
                    .resizable()
                    .scaledToFit()
            }
            
            PhotosPicker(selection: $selectedItem,
                        matching: .images) {
                Label("Select Photo", systemImage: "photo")
            }
            .onChange(of: selectedItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        selectedImage = Image(uiImage: uiImage)
                    }
                }
            }
        }
    }
}
```

### Native iOS (UIKit)
```swift
import UIKit
import PhotosUI

class CameraViewController: UIViewController {
    
    func showPhotoPicker() {
        var configuration = PHPickerConfiguration()
        configuration.selectionLimit = 1
        configuration.filter = .images
        
        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = self
        present(picker, animated: true)
    }
}

extension CameraViewController: PHPickerViewControllerDelegate {
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        
        guard let result = results.first else { return }
        
        result.itemProvider.loadObject(ofClass: UIImage.self) { [weak self] object, error in
            if let image = object as? UIImage {
                DispatchQueue.main.async {
                    // Use the image
                    print("Got image: \(image.size)")
                }
            }
        }
    }
}
```

---

## 📍 Geolocation

### Capacitor Plugin
```typescript
import { Geolocation } from '@capacitor/geolocation';

const coordinates = await Geolocation.getCurrentPosition();
```

### Native iOS
```swift
import CoreLocation

class LocationService: NSObject, ObservableObject {
    private let manager = CLLocationManager()
    @Published var location: CLLocation?
    
    override init() {
        super.init()
        manager.delegate = self
    }
    
    func requestLocation() {
        // Request permission
        manager.requestWhenInUseAuthorization()
        
        // Get location
        manager.requestLocation()
    }
}

extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        location = locations.first
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error)")
    }
}

// Usage in SwiftUI:
struct LocationView: View {
    @StateObject private var locationService = LocationService()
    
    var body: some View {
        VStack {
            if let location = locationService.location {
                Text("Lat: \(location.coordinate.latitude)")
                Text("Long: \(location.coordinate.longitude)")
            }
            
            Button("Get Location") {
                locationService.requestLocation()
            }
        }
    }
}
```

**Don't forget to add to Info.plist:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby places</string>
```

---

## 🔔 Local Notifications

### Capacitor Plugin
```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

await LocalNotifications.schedule({
  notifications: [
    {
      title: "Hello",
      body: "This is a notification",
      id: 1,
      schedule: { at: new Date(Date.now() + 1000 * 5) }
    }
  ]
});
```

### Native iOS
```swift
import UserNotifications

class NotificationService {
    static let shared = NotificationService()
    
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            return granted
        } catch {
            return false
        }
    }
    
    func scheduleNotification(title: String, body: String, delay: TimeInterval) async throws {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString,
                                          content: content,
                                          trigger: trigger)
        
        try await UNUserNotificationCenter.current().add(request)
    }
}

// Usage:
Task {
    let granted = await NotificationService.shared.requestPermission()
    if granted {
        try await NotificationService.shared.scheduleNotification(
            title: "Hello",
            body: "This is a notification",
            delay: 5
        )
    }
}
```

---

## 💾 File System

### Capacitor Plugin
```typescript
import { Filesystem } from '@capacitor/filesystem';

await Filesystem.writeFile({
  path: 'myfile.txt',
  data: 'Hello World',
  directory: Directory.Documents
});
```

### Native iOS
```swift
import Foundation

class FileService {
    static let shared = FileService()
    
    private var documentsDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    func writeFile(filename: String, content: String) throws {
        let fileURL = documentsDirectory.appendingPathComponent(filename)
        try content.write(to: fileURL, atomically: true, encoding: .utf8)
    }
    
    func readFile(filename: String) throws -> String {
        let fileURL = documentsDirectory.appendingPathComponent(filename)
        return try String(contentsOf: fileURL, encoding: .utf8)
    }
    
    func deleteFile(filename: String) throws {
        let fileURL = documentsDirectory.appendingPathComponent(filename)
        try FileManager.default.removeItem(at: fileURL)
    }
    
    func fileExists(filename: String) -> Bool {
        let fileURL = documentsDirectory.appendingPathComponent(filename)
        return FileManager.default.fileExists(atPath: fileURL.path)
    }
}

// Usage:
try FileService.shared.writeFile(filename: "myfile.txt", content: "Hello World")
let content = try FileService.shared.readFile(filename: "myfile.txt")
```

---

## 🌐 Network Status

### Capacitor Plugin
```typescript
import { Network } from '@capacitor/network';

const status = await Network.getStatus();
console.log('Connected:', status.connected);
```

### Native iOS
```swift
import Network

class NetworkMonitor: ObservableObject {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    @Published var isConnected = true
    @Published var connectionType: NWInterface.InterfaceType?
    
    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
                self?.connectionType = path.availableInterfaces.first?.type
            }
        }
        monitor.start(queue: queue)
    }
    
    deinit {
        monitor.cancel()
    }
}

// Usage in SwiftUI:
struct NetworkView: View {
    @StateObject private var networkMonitor = NetworkMonitor()
    
    var body: some View {
        VStack {
            if networkMonitor.isConnected {
                Text("Connected")
                    .foregroundColor(.green)
            } else {
                Text("Disconnected")
                    .foregroundColor(.red)
            }
        }
    }
}
```

---

## 📱 Device Info

### Capacitor Plugin
```typescript
import { Device } from '@capacitor/device';

const info = await Device.getInfo();
console.log(info.model, info.platform);
```

### Native iOS
```swift
import UIKit

struct DeviceInfo {
    static var model: String {
        UIDevice.current.model
    }
    
    static var systemVersion: String {
        UIDevice.current.systemVersion
    }
    
    static var deviceName: String {
        UIDevice.current.name
    }
    
    static var isSimulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    
    static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
    }
    
    static var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
    }
    
    static var bundleIdentifier: String {
        Bundle.main.bundleIdentifier ?? "Unknown"
    }
}

// Usage:
print("Model: \(DeviceInfo.model)")
print("iOS Version: \(DeviceInfo.systemVersion)")
print("App Version: \(DeviceInfo.appVersion)")
```

---

## 🔗 Share / Social Sharing

### Capacitor Plugin
```typescript
import { Share } from '@capacitor/share';

await Share.share({
  title: 'Check this out',
  text: 'Really awesome thing you need to see right now',
  url: 'https://example.com',
});
```

### Native iOS (SwiftUI)
```swift
import SwiftUI

struct ShareExample: View {
    @State private var showShareSheet = false
    
    var body: some View {
        Button("Share") {
            showShareSheet = true
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: ["Check this out!", URL(string: "https://example.com")!])
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
```

### Native iOS (UIKit)
```swift
import UIKit

class ShareViewController: UIViewController {
    
    func shareContent() {
        let items: [Any] = [
            "Check this out!",
            URL(string: "https://example.com")!
        ]
        
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        // For iPad
        if let popoverController = activityVC.popoverPresentationController {
            popoverController.sourceView = view
            popoverController.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
            popoverController.permittedArrowDirections = []
        }
        
        present(activityVC, animated: true)
    }
}
```

---

## 🔐 Biometric Authentication

### Capacitor Plugin
```typescript
import { NativeBiometric } from 'capacitor-native-biometric';

await NativeBiometric.verifyIdentity({
  reason: "For easy log in",
  title: "Log in",
})
```

### Native iOS
```swift
import LocalAuthentication

class BiometricService {
    static let shared = BiometricService()
    
    func authenticate(reason: String) async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw BiometricError.notAvailable
        }
        
        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        )
    }
    
    var biometricType: BiometricType {
        let context = LAContext()
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) else {
            return .none
        }
        
        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        default:
            return .none
        }
    }
}

enum BiometricType {
    case faceID, touchID, none
}

enum BiometricError: LocalizedError {
    case notAvailable
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometric authentication is not available"
        }
    }
}

// Usage:
Task {
    do {
        let success = try await BiometricService.shared.authenticate(reason: "Log in to your account")
        if success {
            print("Authenticated!")
        }
    } catch {
        print("Authentication failed: \(error)")
    }
}
```

**Add to Info.plist:**
```xml
<key>NSFaceIDUsageDescription</key>
<string>We use Face ID for secure authentication</string>
```

---

## 📊 Status Bar

### Capacitor Plugin
```typescript
import { StatusBar } from '@capacitor/status-bar';

await StatusBar.hide();
await StatusBar.setStyle({ style: Style.Dark });
```

### Native iOS (SwiftUI)
```swift
import SwiftUI

struct StatusBarExample: View {
    var body: some View {
        Text("Hello")
            .preferredColorScheme(.dark) // Dark status bar
            .statusBar(hidden: false)
    }
}
```

### Native iOS (UIKit)
```swift
import UIKit

class StatusBarViewController: UIViewController {
    
    // Hide status bar
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent // or .darkContent
    }
}
```

---

## 📝 Summary

| Capacitor Plugin | Native iOS Framework |
|-----------------|---------------------|
| Camera | PhotosUI / UIImagePickerController |
| Geolocation | CoreLocation |
| LocalNotifications | UserNotifications |
| Filesystem | FileManager |
| Network | Network framework |
| Device | UIDevice |
| Share | UIActivityViewController |
| NativeBiometric | LocalAuthentication |
| StatusBar | UIViewController properties |
| Storage | UserDefaults / Keychain |
| Haptics | UIFeedbackGenerator |

## 🎯 General Pattern

1. **Find the native framework** that handles the functionality
2. **Import the framework** at the top of your file
3. **Replace async Capacitor calls** with native async/await Swift code
4. **Update Info.plist** with required permission strings
5. **Handle errors** using Swift's try/catch instead of promise rejections

Most Capacitor features have direct native equivalents that are often more powerful and flexible!
