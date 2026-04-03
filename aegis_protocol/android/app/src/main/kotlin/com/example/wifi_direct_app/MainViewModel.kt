package com.example.wifi_direct_app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.wifi_direct_app.supabase.Supabase
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.serialization.Serializable

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
    val hasAcceptedTransfer: Boolean = false
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
                statusMessage = "Transfer complete — ready for next"
            )
        }
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
                // Success
                _uiState.update { it.copy(isSignedUp = true, isAuthLoading = false) }
            } catch (e: Exception) {
                // Catch any network or Supabase validation errors
                _uiState.update { 
                    it.copy(
                        isAuthLoading = false,
                        authError = e.message ?: "An unexpected error occurred"
                    ) 
                }
            }
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
        if (code.isBlank()) {
            _uiState.update { it.copy(codeVerificationError = "Please enter the security code") }
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
                _uiState.update { 
                    it.copy(isVerifyingCode = false, codeVerificationError = "Verification failed: ${e.message}")
                }
            }
        }
    }
}
