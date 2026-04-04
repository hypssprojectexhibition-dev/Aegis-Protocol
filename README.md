<p align="center">
  <img src="src/assets/logo.png" width="128" height="128" alt="Aegis Protocol Logo">
</p>

<h1 align="center">🛡️ Aegis Protocol (Desktop Edition)</h1>

<p align="center">
  <strong>Advanced Image Security & Traceability Suite</strong><br>
  <em>Watermarking • Cryptographic Splitting • AI-Powered Redaction</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Desktop-blue?style=for-the-badge" alt="Platform Desktop">
  <img src="https://img.shields.io/badge/Status-Alpha-orange?style=for-the-badge" alt="Status Alpha">
  <img src="https://img.shields.io/badge/Branch-Sodium-green?style=for-the-badge" alt="Branch Sodium">
</p>

---

> [!IMPORTANT]
> **Branch Note**: This specific branch (**`sodium`**) is dedicated exclusively to the **Desktop version** of Aegis Protocol. For mobile or web-specific builds, please refer to the appropriate branch.

## 🚀 Overview

Aegis Protocol is a high-security desktop application built with **Tauri**, **React**, and **Rust**. It provides a unified interface for securing, verifying, and redacting sensitive visual information through three state-of-the-art engines.

### 🛡️ 1. Aegis Protect (Steganography)
Powered by **StegaStamp**, this engine embeds invisible, robust watermarks into images. These watermarks survive digital transformations and allow for provenance tracking even after the image has been screenshotted or re-compressed.

### 🗝️ 2. Aegis Verify (Cryptography)
Utilizing **Visual Cryptography**, this engine splits an image into multiple noise-like shares. The original content is only visible when these shares are digitally stacked. This ensures that no single storage location holds the full image, preventing unauthorized access.

### 👁️ 3. Aegis Redact (AI-Powered)
Integrating **RedactionPro**, this engine uses advanced YOLO models and TFLite for real-time detection and masking of sensitive information.
- **Visual**: Faces, Objects, License Plates.
- **Textual**: Names, Passwords, Emails, Phone Numbers, IP Addresses.

---

## 🛠️ Architecture

The desktop application is designed as a **self-contained unit**. All backend processing engines have been consolidated into the project root for ease of development and deployment.

### 📦 Consolidated Backend Services
- `backend/stega/`: FastAPI service for StegaStamp (Port 8000)
- `backend/crypto/`: Flask service for Visual Cryptography (Port 5000)
- `backend/redaction/`: FastAPI service for RedactionPro (Port 8001)

---

## ⚙️ Setup & Development

### Prerequisites
- [Rust](https://www.rust-lang.org/) (for Tauri core)
- [Node.js](https://nodejs.org/) (for React frontend)
- [Python 3.9+](https://www.python.org/) (for AI/ML backends)

### Installation
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/hypssprojectexhibition-dev/Aegis-Protocol.git -b sodium
    ```
2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Python Environments**:
    Create virtual environments in each backend directory and install `requirements.txt`.

### Running the App
1.  **Start Backends**: Start each service in `backend/` using the instructions in their respective subdirectories.
2.  **Launch Tauri**:
    ```bash
    npm run tauri dev
    ```

---

## 🎨 Professional UI

Aegis Protocol (Desktop) features a premium, high-fidelity user interface with:
- **Light/Dark Mode**: Native implementation with unified CSS transitions.
- **Lucide Icons**: Replaced all legacy emojis with professional SVG iconography.
- **Logo Integration**: Full branding throughout the workspace.

---

<p align="center">
  Built with ❤️ for Aegis Protocol. All Rights Reserved.
</p>
