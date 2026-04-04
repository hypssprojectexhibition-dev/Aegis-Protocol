<div align="center">

<img src="app/src/aegis logo un.png" width="128" height="auto" alt="Aegis Protocol Logo">

# Aegis Protocol (Mobile)

**Encrypted Visual Cryptography & P2P Transfer Suite**

[![Android Native](https://img.shields.io/badge/Android-Native-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9+-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![Jetpack Compose](https://img.shields.io/badge/Compose-UI-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://developer.android.com/jetpack/compose)
[![WiFi Direct](https://img.shields.io/badge/WiFi_Direct-P2P-005571?style=for-the-badge&logo=wi-fi&logoColor=white)](https://developer.android.com/guide/topics/connectivity/wifip2p)
[![Supabase Configured](https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

*Built meticulously for Android environments, fusing military-grade Visual Cryptography with high-speed WiFi Direct transfers.*

</div>

<br>

Aegis Protocol is a self-contained, high-security mobile application engineered to protect, transfer, and reconstruct highly sensitive visual information offline. Built securely natively in **Kotlin**, it completely eschews cloud-reliance for transmission of the primary payload by leveraging a dedicated local **Tri-Port TCP/UDP Pipeline** over Android's native WiFi Direct APIs.

---

## ⚡ Core Engines

The suite utilizes three distinct subsystems orchestrated directly by the native Android thread pools.

### 1. Aegis Vault (.hypss Containerization)
Powered by a proprietary binary format (`.hypss`), this engine wraps raw image data using **AES-256-GCM** encryption.
- **Resilience**: Features PBKDF2 iterations for brute-force resistance while remaining highly optimized for mid-range mobile processors (MIUI/Snapdragon).
- **Stealth**: Bypasses the Android `MediaScanner` entirely. Files are locked inside `/data/user/0/...` internal app storage and remain completely invisible to system galleries and 3rd-party spywares.

### 2. Aegis Split (Visual Cryptography)
Implements a strict `(2,2)` Visual Cryptography mesh to protect top-secret blueprints and node schematics natively via `Bitmap` array manipulation.
- **Data Fragmentation**: Slices a single source image into two discrete noise fragments.
- **Decentralization**: The original media cannot be mathematically reconstructed without possessing both fragments—one deployed to a zero-trust Supabase bucket and the other sent entirely offline.

### 3. Aegis Link (Tri-Port Protocol)
A custom-built, hardware-level local networking stack replacing Bluetooth dependence.
- **High-Speed Binary Pipe**: Streams raw cryptographic bytes directly over Port `8988`.
- **Dynamic IP Resolution**: Port `8989` tracks dynamic IP allocations between Client nodes and Group Owners (GO).
- **Secure Handshakes**: Port `8990` manages strict permissioned `REQUEST` -> `ACCEPT`/`REJECT` signaling.

---

## 🏗️ Architecture Design

Aegis Protocol rejects cross-platform limitations, compiling 100% natively. It relies heavily on `Kotlin Coroutines` mapped to `Dispatchers.Default` and `Dispatchers.IO` to ensure intense matrix cryptography operations never drop UI frames.

```text
Aegis-Protocol/
├── app/
│   ├── src/main/kotlin/...
│   │   ├── ui/               # Jetpack Compose Reactive Views
│   │   ├── utils/            # Hypss Crypto & Image Processors
│   │   └── supabase/         # Cloud Storage SDK Clients
│   ├── src/main/res/         # XML Vectors & Launch Assets
│   └── build.gradle.kts      # Module configurations
├── gradle/                   # Gradle wrapper bindings
└── build.gradle.kts          # Top-Level dependencies
```

---

## 🎨 The Tactile Design System

Aegis Protocol uses declarative **Jetpack Compose** tailored strictly for a human-centric, off-white and deep coral aesthetic.

- **Dynamic Transitions**: Fluid navigation state bindings and asynchronous image rendering (`Coil`).
- **Integrated CameraX**: Bespoke camera pipelines that gracefully manage OEM hardware limitations natively, feeding securely directly into the cryptography mesh.

---

## 🔐 Identity & Authentication (Supabase)

The decentralized cloud-share (Share 1) leverages a zero-trust network execution directly into a configured **Supabase Storage** bucket.

To configure your own node for the storage routing, setup your active credentials inside the application build:
```kotlin
// Internal SupabaseClient.kt bindings
val Supabase = createSupabaseClient(
    supabaseUrl = "https://[YOUR_INSTANCE].supabase.co",
    supabaseKey = "..."
) {
    install(Storage)
}
```

---

## 🛡️ Development & Branching

This repository follows a multi-platform release strategy:

*   **`main` / `dev`**: Original centralized experimental drafts.
*   **`sodium`**: Dedicated production branch for the **Desktop Build** (Rust/React/Tauri).
*   **`Flourine`**: The active pipeline for this **100% Native Android Kotlin** build.

---

## 🛠️ Performance & Security

Aegis Protocol is built on a high-concurrency stack designed for physical-first cryptographic operations:

*   **Kotlin Native**: Unrestricted bridging directly to hardware WiFi Direct APIs.
*   **Jetpack Compose**: Blazing fast UI with immutable state safety.
*   **Supabase Storage**: Used purely as a blind physical drop-box with auto-purging retrieval logic.
*   **Local Processing**: No raw payload data ever leaves the local memory buffer until explicitly sealed by `HypssContainer`.

---

## 🏗️ Getting Started

### Prerequisites

*   **Android Studio**: Jellyfish or newer.
*   **Android SDK**: Minimum 26 (Android 8.0), Target 34.
*   **Physical Hardware**: Due to peer-to-peer radio limitations, this project **cannot** be adequately run on an emulator. You must deploy to **two physical Android devices** to test networking.

### Installation

```bash
# Clone the repository
git clone https://github.com/hypssprojectexhibition-dev/Aegis-Protocol.git
cd Aegis-Protocol

# Switch to the mobile branch
git checkout Flourine

# Build the Debug APK natively
./gradlew assembleDebug

# Clean the workspace
./gradlew clean
```

**Output Location**: `app/build/outputs/apk/debug/app-debug.apk`

---

<div align="center">
  <p><strong>Mobile Encryption Environment • Decentralized by Design</strong></p>
  <p>Built with precision for the Aegis Protocol.</p>
</div>
