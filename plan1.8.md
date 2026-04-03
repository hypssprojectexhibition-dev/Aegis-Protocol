# App Name: Local Photo Transfer (Phase 1.8 - Auto Detection + Permission Flow)

## Objective:

Improve user experience by:

* Automatically detecting nearby devices
* Removing manual scan step
* Adding user permission before receiving files

⚠️ This phase enhances usability but does NOT include advanced identity systems (UUID, broadcast matching logic from Phase 2).

---

# ⚠️ STRICT RULES

* Do NOT implement UUID system
* Do NOT implement known users storage
* Do NOT add auto-connect memory
* ONLY improve flow using existing WiFi Direct system

---

# 🔁 WORKFLOW RULE

After completing each sub-phase:

1. Say:
   → "Phase 1.8.X Completed"

2. Provide:

   * What was implemented
   * What user should see

3. Provide:

   * Testing steps

4. WAIT for confirmation

---

# 🚀 PHASE BREAKDOWN

---

## 🔹 PHASE 1.8.1: Auto Device Discovery on App Open

### Goal:

Automatically scan for nearby devices when app opens

---

### Implementation:

* Start WiFi Direct discovery automatically on app launch
* Continuously update device list
* Remove need for "Scan Devices" button

---

### ✅ What user should see:

* Device list appears automatically
* Nearby devices visible without clicking anything

---

### 🧪 How to TEST:

1. Open app on 2 devices
2. Wait 2–5 seconds

👉 Check:

* Devices appear automatically in list

---

### ✔️ Success Criteria:

* No manual scan required
* Devices visible on open

---

## 🔹 PHASE 1.8.2: Live Device List UI

### Goal:

Show available devices clearly

---

### Implementation:

* Display list of nearby devices
* Show basic status:

  * Available / Not Available

---

### 🧪 How to TEST:

1. Open app
2. Check:

* Devices list updates dynamically

---

### ✔️ Success Criteria:

* List refreshes automatically

---

## 🔹 PHASE 1.8.3: Send Flow After Capture

### Goal:

Send image after capturing

---

### Implementation:

* User clicks "Capture Photo"
* After capture:
  → Show list of available devices
* User selects device

---

### 🧪 How to TEST:

1. Capture photo
2. Select device

👉 Check:

* App proceeds to send stage

---

### ✔️ Success Criteria:

* Smooth transition from capture → send

---

## 🔹 PHASE 1.8.4: Receiver Permission Request

### Goal:

Ask permission before receiving file

---

### Implementation:

* When sender initiates transfer:

  * Receiver gets popup:
    → "Device XYZ wants to send you a photo"

* Buttons:

  * Accept
  * Reject

---

### ✅ What user should see:

* Popup on receiver device

---

### 🧪 How to TEST:

1. Device A sends image
2. Device B receives request

👉 Check:

* Popup appears
* Accept / Reject visible

---

### ✔️ Success Criteria:

* Transfer does NOT start without permission

---

## 🔹 PHASE 1.8.5: Conditional Transfer Logic

### Goal:

Transfer only after acceptance

---

### Implementation:

* If ACCEPT:
  → Establish connection
  → Start file transfer

* If REJECT:
  → Cancel request
  → Show message on sender

---

### 🧪 How to TEST:

1. Send image
2. On receiver:

   * Reject → check no transfer
   * Accept → check transfer

---

### ✔️ Success Criteria:

* Transfer only happens after approval

---

## 🔹 PHASE 1.8.6: Connection Trigger Optimization

### Goal:

Delay connection until needed

---

### Implementation:

* DO NOT connect during discovery
* Connect ONLY when:

  * User selects device
  * Receiver accepts request

---

### 🧪 How to TEST:

1. Open app
   👉 Check:

* No automatic connection

2. Send image
   👉 Check:

* Connection happens only then

---

### ✔️ Success Criteria:

* Efficient connection usage

---

# 📱 FINAL UI FLOW

1. App opens
   → Devices auto-detected

2. User clicks "Capture Photo"
   → Takes photo

3. User selects device
   → Request sent

4. Receiver gets popup
   → Accept / Reject

5. If accepted
   → Connection + Transfer

---

# ⚠️ IMPORTANT TECH NOTES

* Use existing WiFi Direct discovery system
* Use sockets ONLY after acceptance
* Ensure UI is responsive and smooth

---

# ❌ DO NOT ADD

* UUID system
* Known users memory
* Background services
* Auto-connect logic

---

# 🏁 FINAL EXPECTATION

After this phase:

* Devices appear automatically
* No manual scan needed
* User-friendly send flow
* Secure transfer with permission system
