# App Name: Local Device Connection Test (Phase 1 - Controlled Basic)

## Objective:

Build a very basic mobile application to test WiFi Direct functionality step-by-step.

The app should ONLY:

* Scan nearby devices
* Connect manually
* Send and receive a file

No extra features beyond this.

---

# ⚠️ STRICT DEVELOPMENT RULES

* DO NOT implement everything at once
* Implement ONLY one phase at a time
* STOP after each phase
* WAIT for user confirmation before moving to next phase

---

# 🔁 WORKFLOW RULE (VERY IMPORTANT)

After completing EACH phase:

1. Clearly say:
   → "Phase 1.X Completed"

2. Provide:

   * What was implemented
   * What user should see

3. Provide:

   * Step-by-step TESTING INSTRUCTIONS (non-technical)

4. WAIT for user confirmation before continuing

---

# 🧱 TECH STACK (MANDATORY)

* Framework: Flutter (for UI and app logic)
* Native Layer: Kotlin (for WiFi Direct implementation)
* Build System: Flutter project with Gradle (Android)
* Communication: Socket-based file transfer after connection

---

# 📱 TARGET PLATFORM

* Android only
* Minimum SDK: API 26 (Android 8.0)
* Device must support WiFi Direct

---

# 🔐 PERMISSIONS REQUIRED

* Camera → NOT required in Phase 1
* Location → required for WiFi Direct discovery
* Nearby Devices permission
* WiFi access permissions
* Storage permission (for saving received files)

---

# 🚀 PHASE BREAKDOWN

---

## 🔹 PHASE 1.1: Basic UI Setup

### Goal:

Create minimal UI

---

### Implementation:

* Home Screen
* Button: "Scan Devices"

---

### ✅ What user should see:

* Simple screen with one button

---

### 🧪 How to TEST:

1. Open app
2. Check:

   * App opens successfully
   * Button is visible

---

### ✔️ Success Criteria:

* No crash
* Button works

---

## 🔹 PHASE 1.2: WiFi Direct Initialization

### Goal:

Prepare WiFi Direct system

---

### Implementation:

* Initialize WiFi Direct using Kotlin (native Android)
* Request permissions:

  * Location
  * Nearby devices
  * WiFi access

---

### ✅ What user should see:

* Permission popups

---

### 🧪 How to TEST:

1. Open app
2. Allow all permissions
3. Ensure no crash

---

### ✔️ Success Criteria:

* Permissions granted
* App stable

---

## 🔹 PHASE 1.3: Device Scanning

### Goal:

Discover nearby devices

---

### Implementation:

* On "Scan Devices" click:

  * Start WiFi Direct discovery
  * Show nearby devices list

---

### ✅ What user should see:

* List of nearby devices

---

### 🧪 How to TEST:

1. Install app on 2 phones
2. Open app on both
3. Click "Scan Devices"

👉 Check:

* Other device appears

---

### ✔️ Success Criteria:

* Devices visible in list

---

## 🔹 PHASE 1.4: Device Connection

### Goal:

Connect to selected device

---

### Implementation:

* Tap device → initiate connection via WiFi Direct

---

### ✅ What user should see:

* "Connecting..."
* "Connected"

---

### 🧪 How to TEST:

1. Tap device
2. Observe connection

---

### ✔️ Success Criteria:

* Devices connect successfully

---

## 🔹 PHASE 1.5: Send File

### Goal:

Send a file after connection

---

### Implementation:

* Use socket connection
* Send dummy file or sample image

---

### ✅ What user should see:

* "Sending..."
* "Sent successfully"

---

### 🧪 How to TEST:

1. Connect two devices
2. Send file

👉 Check:

* File reaches other device

---

### ✔️ Success Criteria:

* File sent successfully

---

## 🔹 PHASE 1.6: Receive File

### Goal:

Receive and save file

---

### Implementation:

* Accept incoming connection
* Receive file via socket
* Save locally

---

### ✅ What user should see:

* "File received"

---

### 🧪 How to TEST:

1. Send file from Device A
2. Check Device B

👉 Check:

* File saved in storage

---

### ✔️ Success Criteria:

* File received correctly

---

# ⚠️ IMPORTANT TECHNICAL INSTRUCTIONS

* Use REAL WiFi Direct (NOT internet, NOT hotspot)
* Use Kotlin for WiFi Direct (native Android)
* Flutter should handle UI only
* Use socket-based communication for file transfer

---

# ❌ STRICTLY DO NOT ADD

* Camera functionality
* Auto connect
* Background services
* UUID system
* Broadcast system
* Known users list
* Any advanced logic

---

# 🏁 FINAL EXPECTATION

After completing all phases:

* App can scan nearby devices
* Connect manually
* Send and receive files successfully
* Works on real Android devices
