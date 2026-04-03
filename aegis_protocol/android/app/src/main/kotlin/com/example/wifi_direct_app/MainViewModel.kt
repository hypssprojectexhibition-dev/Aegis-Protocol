package com.example.wifi_direct_app

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class PeerDevice(val name: String, val address: String, val status: String)

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
    val permissionRequestPending: Boolean = false
)

class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

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
    }

    fun updateStatusMessage(message: String) {
        _uiState.update { it.copy(statusMessage = message) }
    }

    fun setConnectingAddress(address: String?) {
        _uiState.update { it.copy(connectingToAddress = address) }
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
}
