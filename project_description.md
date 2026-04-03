# SnapDrop: The Absolute Master Technical Specification (100% Native Kotlin)

## 🏁 1. Project Genesis & Vision
SnapDrop was conceived to solve the "local sharing" problem on Android without the friction of Bluetooth pairing or the data-cost of cloud services. It is a high-speed, local-only, P2P photo transfer suite.

### The Evolution (Project History)
1.  **Phase 0-1.7**: Foundation of WiFi Direct services (Managers, Receivers, and Sockets).
2.  **Phase 1.8**: Implementation of **Continuous Automated Discovery**. Replaced manual scanning with a recursive 12-second heartbeat loop to ensure peers stay visible.
3.  **Phase 1.9**: **Native Android Share Integration**. Added `<intent-filter>` for `ACTION_SEND` in the manifest to allow any Gallery app to pipe data into SnapDrop.
4.  **Phase 1.9.5**: **Human-Centric UI Redesign**. Transitioned from "AI-Generic Dark" to a warm, off-white/coral aesthetic with premium micro-interactions.
5.  **Phase 2.0 (Final Migration)**: **Flutter Deprecation**. The entire Flutter/Dart layer was deleted. The UI was rebuilt from scratch using **Jetpack Compose**, and all logic was bound directly to the **Android Lifecycle & ViewModel**.

---

## ⚙️ 2. Deep Build Infrastructure

### A. Root `settings.gradle.kts`
Defines the project name and the app module entry point.
```kotlin
rootProject.name = "SnapDrop"
include(":app")
```

### B. Root `build.gradle.kts`
Standardizes the build environment across all subprojects.
```kotlin
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
```

### C. App Module `build.gradle.kts`
The mission-critical configuration file.
- **Plugins**: `com.android.application`, `org.jetbrains.kotlin.android`.
- **SDK Targets**: `compileSdk = 34`, `targetSdk = 34`, `minSdk = 26`.
- **UI Engine**: Jetpack Compose (`kotlinCompilerExtensionVersion = "1.5.8"`).
- **Toolchain**: `JVM 1.8` for source and target compatibility.

### D. System Properties (`gradle.properties`)
```properties
org.gradle.jvmargs=-Xmx8G -XX:MaxMetaspaceSize=4G -XX:ReservedCodeCacheSize=512m
android.useAndroidX=true
android.enableJetifier=true
android.suppressUnsupportedCompileSdk=34
```

---

## 📡 3. The Tri-Port Network Architecture
SnapDrop utilizes three specialized socket channels for total orchestration.

| Port | Protocol | Service | Description |
|------|----------|---------|-------------|
| **8988** | TCP | `FileTransferService` / `FileReceiverService` | **Binary Data Pipe**: Streams raw image bytes directly between device filesystems. |
| **8989** | TCP/UDP | `HandshakeService` | **IP Resolver**: A custom beacon system where the Client "announces" itself to the Group Owner so the GO captures the Client's dynamic IP address. |
| **8990** | TCP | `PermissionService` | **Command Signaling**: Orchestrates the `REQUEST` -> `ACCEPT`/`REJECT` handshake before Port 8988 opens. |

---

## 📱 4. UI Layer Tech Stack (Jetpack Compose)

The UI is built on a custom tokens system (`ui/HomeScreen.kt`):
- **Secondary Background**: `#F6F5F3` (Soft off-white for a warm, human feel).
- **Primary Accent**: `#E8715A` (Warm Coral).
- **Components**:
    - `HomeScreen`: Uses `LazyColumn` for peer listing and `Scaffold` for top-bar management.
    - `CameraScreen`: Integrated via `androidx.camera.view.PreviewView` and `AndroidView` interop.
    - `PhotoCard`: Shows real-time previews of captured/shared images using `AsyncImage` (Coil).
    - `IncomingRequestDialog`: A native `ModalBottomSheet` that slides up for file approval.

---

## 📂 5. Exhaustive File-by-File Breakdown

### 📍 Core Module (`com.example.wifi_direct_app`)
- **`MainActivity.kt`**: The system host. Handles `Shared Intents`, `Permissions`, and `UI setContent`.
- **`MainViewModel.kt`**: The app's heart. Holds the `MainUiState` StateFlow. Coordinates between UI events and Background Services.
- **`WiFiDirectManager.kt`**: API Wrapper. Simplifies P2P initialization, discovery, and logic.
- **`WiFiDirectBroadcastReceiver.kt`**: Bridges Android OS events (P2P connected/disconnected) into the app.
- **`FileTransferService.kt`**: Logic for reading a file and streaming it to a socket.
- **`FileReceiverService.kt`**: Server socket logic for accepting bytes and writing them to a `LocalFile`.
- **`HandshakeService.kt`**: Specific logic for Client IP discovery on the Group Owner side.
- **`PermissionService.kt`**: Manages the socket-based "Accept/Decline" handshake.

### 📍 UI Components (`com.example.wifi_direct_app.ui`)
- **`HomeScreen.kt`**: Contains the declarative UI for the main dashboard.
- **`CameraScreen.kt`**: Contains the CameraX implementation and shutter-button logic.

### 📍 Utils & Helper (`com.example.wifi_direct_app.utils`)
- **`MediaStoreUtils.kt`**: Handles "Permanence". It takes a raw file from the app's cache and moves it to the device's public **Gallery** using `ContentResolver`.

---

## 📜 6. Manifest Analysis
The `AndroidManifest.xml` stores the app's structural identity:
- **Share Implementation**:
    ```xml
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="image/*" />
    </intent-filter>
    ```
- **Hardware Integration**: Requests `CAMERA` and `NEARBY_WIFI_DEVICES` (Android 13+ support).

---

## 🚦 7. The Build & Run Command List
- **Build APK**: `cd android; ./gradlew assembleDebug`
- **Clean Project**: `./gradlew clean`
- **Output Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔄 8. Final Status & Verification
- **Framework**: 100% Native Kotlin / Jetpack Compose.
- **Flutter Codebase**: 0% (COMPLETELY REMOVED).
- **Stability**: Tested with Gradle Clean + Build (Exit 0).
- **UI Design**: Production-grade, human-centric warm theme.

---

## 🚀 9. Changelog (Live Updates)
- **Phase 2.1 (Current)**: **Instant Image Viewing**. Enhanced `MediaStoreUtils` to return the `Uri` of the saved file in the gallery. Added an `ACTION_VIEW` intent invocation in `MainActivity` to automatically open the newly received photo directly in the user's default gallery app immediately upon successful transfer.
