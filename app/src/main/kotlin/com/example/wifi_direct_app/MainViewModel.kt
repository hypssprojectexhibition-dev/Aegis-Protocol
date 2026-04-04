package com.example.wifi_direct_app

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.wifi_direct_app.supabase.Supabase
import com.example.wifi_direct_app.utils.VisualCryptoUtils
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import java.io.File

data class PeerDevice(val name: String, val address: String, val status: String)

@Serializable
data class TransferRecord(val code: String)

data class MainUiState(
    val isInitialized: Boolean = false,
    val isConnected: Boolean = false,
    val isRequestingPermission: Boolean = false,
    val isSending: Boolean = false,
    val statusMessage: String = "Starting up...",
    val peers: List<PeerDevice> = emptyList(),
    val connectingToAddress: String? = null,
    val isGroupOwner: Boolean = false,
    val targetIp: String? = null,
    val capturedImagePath: String? = null,
    val permissionRequestPending: Boolean = false,
    
    // Auth State (Supabase)
    val isSignedUp: Boolean = false,
    val showSignIn: Boolean = true,
    val isAuthLoading: Boolean = false,
    val authError: String? = null,
    
    // Transfer Code State (Supabase)
    val generatedTransferCode: String? = null,
    val isGeneratingCode: Boolean = false,
    val isVerifyingCode: Boolean = false,
    val codeVerificationError: String? = null,
    val hasAcceptedPermission: Boolean = false,
    
    // Visual Cryptography State
    val share1Path: String? = null,
    val share2Path: String? = null,
    val reconstructedBitmap: android.graphics.Bitmap? = null,
    val isProcessingCrypto: Boolean = false,
    val isUploadingShare: Boolean = false,
    val isDownloadingShare: Boolean = false
)

class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        // Automatically restore session if the user is already logged in securely
        viewModelScope.launch {
            try {
                val session = Supabase.client.auth.currentSessionOrNull()
                if (session != null) {
                    _uiState.update { it.copy(isSignedUp = true) }
                }
            } catch (e: Exception) {
                // Ignore gracefully if no network or no session
            }
        }
    }

    fun updateInitialized(initialized: Boolean, message: String) {
        _uiState.update { it.copy(isInitialized = initialized, statusMessage = message) }
    }

    fun updatePeers(peers: List<PeerDevice>) {
        _uiState.update { it.copy(peers = peers) }
    }

    fun updateConnectionStatus(isConnected: Boolean, isGroupOwner: Boolean = false, targetIp: String? = null) {
        _uiState.update { 
            it.copy(
                isConnected = isConnected,
                isGroupOwner = isGroupOwner,
                targetIp = targetIp,
                statusMessage = if (isConnected) {
                    if (targetIp == null && isGroupOwner) "Connected, resolving peer..." else "Connected — ready to send"
                } else "Disconnected",
                connectingToAddress = if (!isConnected) null else it.connectingToAddress
            )
        }
        
        // Auto-generate security code when fully connected with a target IP
        if (isConnected && targetIp != null && _uiState.value.generatedTransferCode == null) {
            generateSecureCode()
        }
    }

    fun updateStatusMessage(message: String) {
        _uiState.update { it.copy(statusMessage = message) }
    }

    fun setConnectingAddress(address: String?) {
        _uiState.update { it.copy(connectingToAddress = address) }
    }

    fun resetForNewTransfer() {
        _uiState.update {
            it.copy(
                isConnected = false,
                isGroupOwner = false,
                targetIp = null,
                connectingToAddress = null,
                capturedImagePath = null,
                isSending = false,
                isRequestingPermission = false,
                permissionRequestPending = false,
                generatedTransferCode = null,
                isGeneratingCode = false,
                isVerifyingCode = false,
                codeVerificationError = null,
                share1Path = null,
                share2Path = null,
                reconstructedBitmap = null,
                statusMessage = "Transfer complete — ready for next"
            )
        }
    }

    fun updateShare2Path(path: String?) {
        _uiState.update { it.copy(share2Path = path) }
    }

    fun setCapturedImage(path: String?) {
        _uiState.update { it.copy(capturedImagePath = path, statusMessage = "Photo ready — pick a device") }
    }

    fun setSending(isSending: Boolean) {
        _uiState.update { it.copy(isSending = isSending) }
    }

    fun setRequestingPermission(isRequesting: Boolean) {
        _uiState.update { it.copy(isRequestingPermission = isRequesting) }
    }

    fun setIncomingPermissionRequest(pending: Boolean) {
        _uiState.update { it.copy(permissionRequestPending = pending) }
    }

    // --- Authentication (Supabase) ---
    fun clearAuthError() {
        _uiState.update { it.copy(authError = null) }
    }

    fun toggleAuthScreen() {
        _uiState.update { it.copy(showSignIn = !it.showSignIn, authError = null) }
    }

    fun signIn(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _uiState.update { it.copy(authError = "Email and password cannot be empty") }
            return
        }
        
        _uiState.update { it.copy(isAuthLoading = true, authError = null) }
        
        viewModelScope.launch {
            try {
                Supabase.client.auth.signInWith(Email) {
                    this.email = email
                    this.password = pass
                }
                _uiState.update { it.copy(isSignedUp = true, isAuthLoading = false) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isAuthLoading = false, authError = e.message ?: "Invalid login credentials") 
                }
            }
        }
    }

    fun signUp(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _uiState.update { it.copy(authError = "Email and password cannot be empty") }
            return
        }
        
        _uiState.update { it.copy(isAuthLoading = true, authError = null) }
        
        viewModelScope.launch {
            try {
                Supabase.client.auth.signUpWith(Email) {
                    this.email = email
                    this.password = pass
                }
                _uiState.update { it.copy(isSignedUp = true, isAuthLoading = false) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isAuthLoading = false, authError = e.message ?: "An unexpected error occurred") 
                }
            }
        }
    }

    fun continueAsGuest() {
        _uiState.update { it.copy(isAuthLoading = true, authError = null) }
        viewModelScope.launch {
            // Bypass auth or use anonymous sign-in
            // For rapid dev testing, we mark as signed up
            _uiState.update { it.copy(isSignedUp = true, isAuthLoading = false) }
        }
    }

    // --- Transfer Code (Supabase Postgrest) ---
    fun generateSecureCode() {
        _uiState.update { it.copy(isGeneratingCode = true) }
        
        viewModelScope.launch {
            try {
                val code = (100000..999999).random().toString()
                Supabase.client.postgrest["transfers"].insert(TransferRecord(code = code))
                _uiState.update { it.copy(generatedTransferCode = code, isGeneratingCode = false) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isGeneratingCode = false,
                        statusMessage = "Code generation failed: ${e.message}"
                    ) 
                }
            }
        }
    }

    // --- Transfer Code Verification (Receiver Side) ---
    fun verifyTransferCode(code: String, onSuccess: () -> Unit) {
        if (code.isBlank() || code.length != 6) {
            _uiState.update { it.copy(codeVerificationError = "Please enter a valid 6-digit code") }
            return
        }
        
        _uiState.update { it.copy(isVerifyingCode = true, codeVerificationError = null) }
        
        viewModelScope.launch {
            try {
                val result = Supabase.client.postgrest["transfers"]
                    .select { filter { eq("code", code) } }
                    .decodeList<TransferRecord>()
                
                if (result.isNotEmpty()) {
                    _uiState.update { it.copy(isVerifyingCode = false, codeVerificationError = null) }
                    onSuccess()
                } else {
                    _uiState.update { it.copy(isVerifyingCode = false, codeVerificationError = "Invalid code. Try again.") }
                }
            } catch (e: Exception) {
                Log.w("MainViewModel", "Postgrest verification failed, attempting storage-based verification", e)
                // Fallback: If Postgrest fails (e.g. guest mode, no RLS policy), 
                // try to verify by checking if the share file exists in storage
                try {
                    val bucket = Supabase.client.storage.from("Ahuja")
                    val bytes = bucket.downloadPublic("$code.hypss")
                    if (bytes.isNotEmpty()) {
                        _uiState.update { it.copy(isVerifyingCode = false, codeVerificationError = null) }
                        onSuccess()
                    } else {
                        _uiState.update { it.copy(isVerifyingCode = false, codeVerificationError = "Invalid code. No share found.") }
                    }
                } catch (storageEx: Exception) {
                    Log.e("MainViewModel", "Storage verification also failed", storageEx)
                    _uiState.update { 
                        it.copy(isVerifyingCode = false, codeVerificationError = "Verification failed: ${storageEx.message}")
                    }
                }
            }
        }
    }
    // --- Combined Verify + Reconstruct (single clean flow) ---
    fun verifyAndReconstruct(code: String, share2Path: String) {
        if (code.isBlank() || code.length != 6) {
            _uiState.update { it.copy(codeVerificationError = "Please enter a valid 6-digit code") }
            return
        }
        
        _uiState.update { it.copy(isVerifyingCode = true, codeVerificationError = null, statusMessage = "Verifying code...") }
        
        viewModelScope.launch {
            try {
                // Try to download the share with the given code from storage. 
                // If the file exists, the code is valid. This is the single source of truth.
                val s1BytesRaw = withContext(Dispatchers.IO) {
                    val bucket = Supabase.client.storage.from("Ahuja")
                    bucket.downloadPublic("$code.hypss")
                }
                
                if (s1BytesRaw.isEmpty()) {
                    _uiState.update { it.copy(isVerifyingCode = false, codeVerificationError = "Invalid code. No share found.") }
                    return@launch
                }
                
                Log.d("MainViewModel", "Code verified! Downloaded Share 1: ${s1BytesRaw.size} bytes")
                _uiState.update { it.copy(isVerifyingCode = false, isDownloadingShare = true, statusMessage = "Code verified! Reconstructing image...") }
                
                // Decrypt and reconstruct on appropriate threads
                val reconstructed = withContext(Dispatchers.Default) {
                    // Unseal (decrypt) the .hypss containers back into PNG byte arrays
                    val s1PngBytes = com.example.wifi_direct_app.utils.HypssContainer.unseal(s1BytesRaw, code)
                    val s2Raw = File(share2Path).readBytes()
                    val s2PngBytes = com.example.wifi_direct_app.utils.HypssContainer.unseal(s2Raw, code)
                    
                    // Decode to Bitmaps
                    val s1Bitmap = VisualCryptoUtils.pngBytesToBitmap(s1PngBytes)
                        ?: throw IllegalStateException("Failed to decode Share 1 PNG")
                    
                    val s2Bitmap = VisualCryptoUtils.pngBytesToBitmap(s2PngBytes)
                        ?: throw IllegalStateException("Failed to decode Share 2 PNG")
                    
                    Log.d("MainViewModel", "Share 1: ${s1Bitmap.width}x${s1Bitmap.height}, Share 2: ${s2Bitmap.width}x${s2Bitmap.height}")
                    
                    val result = VisualCryptoUtils.reconstructImage(s1Bitmap, s2Bitmap)
                    s1Bitmap.recycle()
                    s2Bitmap.recycle()
                    result
                }
                
                _uiState.update { 
                    it.copy(
                        reconstructedBitmap = reconstructed,
                        isDownloadingShare = false,
                        statusMessage = "Photo reconstructed successfully!"
                    ) 
                }
            } catch (e: javax.crypto.AEADBadTagException) {
                Log.e("MainViewModel", "Verify & reconstruct failed: Invalid OTP (Bad Tag)", e)
                _uiState.update { 
                    it.copy(
                        isVerifyingCode = false, 
                        isDownloadingShare = false, 
                        codeVerificationError = "Security Code Invalid"
                    ) 
                }
            } catch (e: Exception) {
                Log.e("MainViewModel", "Verify & reconstruct failed", e)
                _uiState.update { 
                    it.copy(
                        isVerifyingCode = false, 
                        isDownloadingShare = false, 
                        codeVerificationError = "Failed: ${e.message}"
                    ) 
                }
            }
        }
    }

    fun saveReconstructedImageToGallery(context: Context) {
        val bitmap = _uiState.value.reconstructedBitmap ?: return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val resolver = context.contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, "SnapDrop_\${System.currentTimeMillis()}.jpg")
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/SnapDrop")
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }

                val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { stream ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        contentValues.clear()
                        contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                        resolver.update(uri, contentValues, null, null)
                    }
                    withContext(Dispatchers.Main) {
                        _uiState.update { it.copy(statusMessage = "Saved to Gallery!") }
                    }
                }
            } catch (e: Exception) {
                Log.e("MainViewModel", "Failed to save image to gallery", e)
            }
        }
    }

    // --- Visual Cryptography & Supabase Storage ---
    
    fun processAndPrepareShares(imagePath: String, internalFilesDir: File, onReady: (String) -> Unit) {
        _uiState.update { it.copy(isProcessingCrypto = true, statusMessage = "Splitting image into shares...") }
        
        viewModelScope.launch {
            try {
                // Ensure OTP exists so we can use it for encryption immediately
                val otpCode = _uiState.value.generatedTransferCode ?: (100000..999999).random().toString()
                if (_uiState.value.generatedTransferCode == null) {
                    _uiState.update { it.copy(generatedTransferCode = otpCode) }
                }

                // Run heavy bitmap operations and encryption on Default thread
                val (s1File, s2File) = withContext(Dispatchers.Default) {
                    val rawBitmap = BitmapFactory.decodeFile(imagePath)
                        ?: throw IllegalStateException("Failed to decode image at $imagePath")
                    
                    // Scale down to max 800px on longest side to keep share files small (~2-3MB)
                    // This is critical because WiFi Direct uses the WiFi adapter,
                    // so Supabase upload/download goes through mobile data
                    val maxDim = 800
                    val originalBitmap = if (rawBitmap.width > maxDim || rawBitmap.height > maxDim) {
                        val scale = maxDim.toFloat() / maxOf(rawBitmap.width, rawBitmap.height)
                        val scaledW = (rawBitmap.width * scale).toInt()
                        val scaledH = (rawBitmap.height * scale).toInt()
                        Log.d("MainViewModel", "Scaling image from ${rawBitmap.width}x${rawBitmap.height} to ${scaledW}x${scaledH}")
                        val scaled = android.graphics.Bitmap.createScaledBitmap(rawBitmap, scaledW, scaledH, true)
                        rawBitmap.recycle()
                        scaled
                    } else {
                        rawBitmap
                    }
                    
                    val (s1, s2) = VisualCryptoUtils.splitImage(originalBitmap)
                    
                    val s1PngBytes = VisualCryptoUtils.bitmapToPngBytes(s1)
                    val s2PngBytes = VisualCryptoUtils.bitmapToPngBytes(s2)
                    
                    // Encrypt shares
                    val s1HypssBytes = com.example.wifi_direct_app.utils.HypssContainer.seal(s1PngBytes, otpCode)
                    val s2HypssBytes = com.example.wifi_direct_app.utils.HypssContainer.seal(s2PngBytes, otpCode)
                    
                    // Save shares to internal files directory to hide them from MediaScanner
                    val s1F = File(internalFilesDir, "share1_${System.currentTimeMillis()}.hypss")
                    val s2F = File(internalFilesDir, "share2_${System.currentTimeMillis()}.hypss")
                    
                    s1F.writeBytes(s1HypssBytes)
                    s2F.writeBytes(s2HypssBytes)
                    
                    Log.d("MainViewModel", "Share 1 size: ${s1F.length() / 1024}KB, Share 2 size: ${s2F.length() / 1024}KB")
                    
                    // Recycle bitmaps to free memory
                    originalBitmap.recycle()
                    s1.recycle()
                    s2.recycle()
                    
                    Pair(s1F, s2F)
                }
                
                _uiState.update { 
                    it.copy(
                        share1Path = s1File.absolutePath,
                        share2Path = s2File.absolutePath,
                        isProcessingCrypto = false,
                        statusMessage = "Shares ready. Uploading Share 1..."
                    ) 
                }
                
                uploadShare1(s1File) {
                    onReady(s2File.absolutePath)
                }
            } catch (e: Exception) {
                Log.e("MainViewModel", "Crypto processing failed", e)
                _uiState.update { it.copy(isProcessingCrypto = false, statusMessage = "Crypto error: ${e.message}") }
            }
        }
    }

    private fun uploadShare1(file: File, onSuccess: () -> Unit) {
        _uiState.update { it.copy(isUploadingShare = true) }
        
        viewModelScope.launch {
            try {
                val code = _uiState.value.generatedTransferCode ?: throw IllegalStateException("OTP Code must be generated before uploading Share 1.")
                
                val bucket = Supabase.client.storage.from("Ahuja")
                bucket.upload("$code.hypss", file.readBytes(), upsert = true)
                
                _uiState.update { it.copy(isUploadingShare = false, statusMessage = "Share 1 secure on cloud. Sending Share 2...") }
                onSuccess()
            } catch (e: Exception) {
                _uiState.update { it.copy(isUploadingShare = false, statusMessage = "Upload failed: ${e.message}") }
            }
        }
    }

    fun downloadAndReconstruct(code: String, share2Path: String) {
        _uiState.update { it.copy(isDownloadingShare = true, statusMessage = "Security code verified. Fetching Share 1...") }
        
        viewModelScope.launch {
            try {
                // Download Share 1 from Supabase on IO thread
                val s1Bytes = withContext(Dispatchers.IO) {
                    val bucket = Supabase.client.storage.from("Ahuja")
                    bucket.downloadPublic("$code.png")
                }
                
                Log.d("MainViewModel", "Downloaded Share 1: ${s1Bytes.size} bytes")
                
                if (s1Bytes.isEmpty()) {
                    _uiState.update { it.copy(isDownloadingShare = false, statusMessage = "Share 1 download failed: empty data") }
                    return@launch
                }
                
                // Decode and reconstruct on IO thread to avoid ANR
                val reconstructed = withContext(Dispatchers.IO) {
                    val s1Bitmap = BitmapFactory.decodeByteArray(s1Bytes, 0, s1Bytes.size)
                    if (s1Bitmap == null) {
                        Log.e("MainViewModel", "Failed to decode Share 1 bitmap from ${s1Bytes.size} bytes")
                        throw IllegalStateException("Failed to decode Share 1 from cloud")
                    }
                    
                    val s2Bitmap = BitmapFactory.decodeFile(share2Path)
                    if (s2Bitmap == null) {
                        s1Bitmap.recycle()
                        Log.e("MainViewModel", "Failed to decode Share 2 at path: $share2Path")
                        throw IllegalStateException("Failed to decode Share 2 from file")
                    }
                    
                    Log.d("MainViewModel", "Share 1: ${s1Bitmap.width}x${s1Bitmap.height}, Share 2: ${s2Bitmap.width}x${s2Bitmap.height}")
                    
                    val result = VisualCryptoUtils.reconstructImage(s1Bitmap, s2Bitmap)
                    
                    // Recycle source bitmaps
                    s1Bitmap.recycle()
                    s2Bitmap.recycle()
                    
                    result
                }
                
                _uiState.update { 
                    it.copy(
                        reconstructedBitmap = reconstructed,
                        isDownloadingShare = false,
                        statusMessage = "Photo reconstructed successfully!"
                    ) 
                }
            } catch (e: Exception) {
                Log.e("MainViewModel", "Reconstruction failed", e)
                _uiState.update { it.copy(isDownloadingShare = false, statusMessage = "Reconstruction failed: ${e.message}") }
            }
        }
    }
}
