<div align="center">

<img src="src/assets/logo.png" width="160" height="auto" alt="Aegis Protocol Logo">

# Aegis Protocol

**Advanced Image Security, Traceability, & Sanitization Suite**

[![Tauri Edge](https://img.shields.io/badge/Tauri-2.0-24C8C6?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![React Ecosystem](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Python Compute](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase Configured](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

*Built meticulously for Desktop and Mobile (Android) environments, fusing Web Technologies with native performance and a unified cloud AI intelligence backend.*

</div>

<br>

Aegis Protocol is a cross-platform (Desktop & Mobile) application engineered to protect, verify, and sanitize highly sensitive visual information. Built on the modern **Tauri 2.0 framework**, it presents a high-performance **React + Tailwind CSS interface**. It communicates with a consolidated, high-availability **FastAPI backend** hosted on **Hugging Face Spaces** for advanced Machine Learning inference and cryptographic routines.

---

## ⚡ Core Engines

The suite utilizes three distinct AI and cryptographic subsystems, perfectly orchestrated via a unified cloud API.

### 1. Aegis Protect (Steganography Layer)
Powered by an implementation of **StegaStamp (TensorFlow)**, this engine embeds deep neural-network-based watermarks directly into image residuals. 
- **Resilience**: Watermarks mathematically survive downscaling, lossy compression, and physical screen captures.
- **Traceability**: Allows administrators to silently inject provenance signatures (e.g., clearance codes) into sensitive documents prior to distribution.

### 2. Aegis Verify (Visual Cryptography)
Advanced visual cryptography that splits sensitive files and images into unintelligible fragments.
- **Data Fragmentation**: Slices a single source image into pseudo-random noise fragments.
- **Decentralization**: The original media cannot be mathematically reconstructed without assembling the required fragmented shards, paving the way for Zero-Trust operations.

### 3. Aegis Redact (NLP & AI-Vision Parsing)
Utilizing rapid **MediaPipe**, **spaCy** NLP recognition, **Tesseract OCR**, and **YOLO** object-detection, Redaction actively scrubs images and documents.
- **Military Grade Filtering**: Instantly locates and masks human faces, sensitive textual data, localized addresses, IP structures, and PII in milliseconds.

---

## 🏗️ Architecture Design

Aegis Protocol recently migrated from scattered local Python instances to a centralized cloud-first architecture to seamlessly support Desktop and Android platforms simultaneously.

- **Frontend Application (`src/`)**: 
  - **Tauri 2**: Manages cross-platform native binaries (Windows `.msi`/`.exe`, Android `.apk`).
  - **React 19, TypeScript, Vite & Tailwind CSS**: Powers a stunning, responsive, hardware-accelerated user interface.
  - **Zustand & React Router**: Efficient state management and rapid client-side routing.

- **Unified Backend API (`backend/`)**:
  - **FastAPI**: A singular master orchestrator deployed natively via Docker to **Hugging Face Spaces**.
  - Provides reliable endpoint access (`/stega`, `/redact`, `/crypto`) accessible 24/7 via the cloud without requiring users to maintain local Python environments.

---

## 🔐 Identity & Access (Supabase)

All workflow instances—cryptographic splitting, watermarking, and redactions—are securely logged to a **Supabase PostgreSQL Ledger**, connected directly to individual operative signatures.

The application securely natively supports:
- **Google Federation**: Robust OAuth bindings configured uniquely to redirect gracefully around Tauri.
- **Email Access Hooks**: Secure password management.

To configure your own node, edit `.env.local`:
```bash
VITE_SUPABASE_URL="https://[YOUR_INSTANCE].supabase.co"
VITE_SUPABASE_ANON_KEY="..."
```

---

## 🚀 How to Run the Project (Desktop & Mobile)

The platform heavily streamlines the development workflow. Since the backend AI endpoints are securely cloud-hosted via Hugging Face by default, developers only need to run the UI application local to their device:

### 1. Prerequisites & Dependencies

*   **Node.js**: v18+ (Required for the frontend React application and Tauri CLI).
*   **Rust**: Stable toolchain via `rustup` (Required for building the Desktop application binaries).
*   **Android Studio**: (Only required if you intend to run/build the application for an Android Mobile device).
*   **Git**: For cloning the repository.

### 2. Local Setup Steps

```bash
# Clone the repository to your local machine
git clone https://github.com/saket/AegisProtocol.git
cd AegisProtocol

# Install Javascript / React dependencies
npm install
```

### 3. Launch Development Environments

**To run the Desktop Application (Windows / macOS / Linux):**
```bash
npm run tauri dev
```

**To run the Mobile Application (Android):**
Make sure your Android device is connected via USB debugging or an Android Studio emulator is running.
```bash
npm run tauri android dev
```

### 4. Build for Production

Compile a native executable or deployable package (`.exe`, `.msi`, `.apk`):
```bash
# Build for Desktop
npm run tauri build

# Build for Android
npm run tauri android build
```

---

## 🛡️ Git & Multi-Platform Strategy

This repository coordinates multiple releases across different platforms.

*   **`main` / `dev`**: Core development branches.
*   **`sodium`**: Primary staging and unified branch orchestrating both Desktop and Mobile releases.

---

## ⚖️ License

Aegis Protocol is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

<div align="center">
  <p><strong>Certified Secure Environment • Always Vigilant</strong></p>
</div>
