# App Name: Local Photo Transfer (Phase 1.7 - Camera Integration)

## Objective:

Extend the existing Phase 1 app by adding camera functionality and enabling real image transfer.

⚠️ This phase must be completed BEFORE Phase 2.

---

# ⚠️ STRICT RULES

* Do NOT modify connection logic
* Do NOT add advanced features
* Only integrate camera + image sending

---

# 🔁 WORKFLOW RULE

After completing this phase:

1. Say:
   → "Phase 1.7 Completed"

2. Provide:

   * What was implemented
   * What user should see

3. Provide:

   * Testing steps

4. WAIT for confirmation

---

# 🚀 FEATURES TO IMPLEMENT

---

## 🔹 PHASE 1.7.1: Camera Integration

### Goal:

Allow user to capture image inside app

---

### Implementation:

* Use Flutter camera plugin
* Open camera screen
* Capture photo
* Save image locally
* Store file path

---

### ✅ What user should see:

* Button: "Capture Photo"
* Camera preview screen
* Capture button

---

### 🧪 How to TEST:

1. Open app
2. Click "Capture Photo"
3. Take photo

👉 Check:

* Image captured
* No crash

---

### ✔️ Success Criteria:

* Camera opens
* Photo captured successfully

---

## 🔹 PHASE 1.7.2: Store Captured Image

### Goal:

Save image locally

---

### Implementation:

* Save image to device storage
* Keep file path accessible

---

### 🧪 How to TEST:

1. Capture photo
2. Check device storage/gallery

👉 Check:

* Image is saved

---

### ✔️ Success Criteria:

* Image exists in storage

---

## 🔹 PHASE 1.7.3: Send Captured Image

### Goal:

Send real captured image instead of dummy file

---

### Implementation:

* Replace dummy file logic
* Use captured image file path
* Send via existing socket connection

---

### ✅ What user should see:

* After capture:
  → Option to "Send Photo"

---

### 🧪 How to TEST:

1. Capture photo
2. Connect to another device
3. Send image

👉 Check:

* Same image received

---

### ✔️ Success Criteria:

* Image transferred correctly

---

## 🔹 PHASE 1.7.4: Receive and Display Image

### Goal:

Handle incoming images properly

---

### Implementation:

* Receive image file
* Save locally
* Optionally preview

---

### 🧪 How to TEST:

1. Send image from Device A
2. Check Device B

👉 Check:

* Image saved
* Image viewable

---

### ✔️ Success Criteria:

* Image intact and viewable

---

# 📱 UI CHANGES

Home Screen should now have:

* Button: "Capture Photo"
* Button: "Scan Devices"

---

# ⚠️ IMPORTANT INSTRUCTIONS

* Use Flutter camera plugin only
* Do NOT change WiFi Direct logic
* Do NOT add:

  * UUID
  * Auto connect
  * Broadcast

---

# ❌ DO NOT ADD

* Filters
* Editing tools
* Gallery selection (optional for future)
* Any advanced UI

---

# 🏁 FINAL EXPECTATION

After this phase:

* User can capture photo
* User can send captured image
* Receiver gets same image
