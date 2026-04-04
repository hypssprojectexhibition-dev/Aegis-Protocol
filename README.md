# Aegis Protocol: 100% Native Kotlin P2P Photo Transfer

Aegis Protocol is a high-speed, local-only, P2P photo transfer suite for Android. It solves the "local sharing" problem without the friction of Bluetooth pairing or the data-cost of cloud services.

## 🏁 Project Vision & Evolution
Originally started as a hybrid experiment, the project has been fully migrated to a **100% Native Kotlin** architecture using **Jetpack Compose** for a premium, responsive UI.

### Key Milestones:
- **Continuous Automated Discovery**: A recursive 12-second heartbeat loop ensures peers stay visible without manual scanning.
- **Native Share Integration**: Supports `ACTION_SEND` intents, allowing users to "Share" directly from any Gallery app into Aegis Protocol.
- **Human-Centric Design**: A warm, off-white/coral aesthetic with smooth micro-interactions.
- **Instant Viewing**: Received photos automatically open in the device's default gallery app immediately after transfer.

## ⚙️ Technical Architecture

### UI Layer (Jetpack Compose)
- **Declarative System**: Built on a custom token system for a warm, premium feel.
- **Components**: `LazyColumn` for peer discovery, `CameraX` for instant captures, and `Coil` for efficient image loading.
- **Permissions**: Guided flows for Camera, Location (for WiFi Direct), and Android 13+ Nearby Devices permissions.

### Network Architecture (Tri-Port Protocol)
| Port | Protocol | Service | Description |
|------|----------|---------|-------------|
| **8988** | TCP | `FileReceiver` | **Binary Data Pipe**: Streams raw image bytes directly. |
| **8989** | TCP/UDP | `Handshake` | **IP Resolver**: Resolves dynamic IP addresses between Client and GO. |
| **8990** | TCP | `Permission` | **Command Signaling**: Handles `REQUEST` -> `ACCEPT`/`REJECT` handshake. |

## 🚦 Build & Run Instructions

### Prerequisites
- Android Studio Jellyfish or newer.
- Android SDK 34 (Target SDK).

### Commands
```bash
# Clone the repository
git clone https://github.com/hypssprojectexhibition-dev/Aegis-Protocol.git

# Navigate to the project root
cd Aegis-Protocol

# Build the Debug APK
./gradlew assembleDebug

# Clean the project
./gradlew clean
```

**Output Location**: `app/build/outputs/apk/debug/app-debug.apk`

---

## 🚀 Changelog (Recent Updates)
- **Phase 2.1**: **Instant Image Viewing**. Enhanced the receiver logic to trigger an `ACTION_VIEW` intent immediately upon successful gallery save.
- **Phase 2.0**: **Flutter Deprecation**. Completely removed the Flutter layer; UI and Logic are now 100% Native Kotlin.
- **Phase 1.9**: **System Share Support**. Integrated with the Android System Share sheet for incoming image streams.
