package com.example.wifi_direct_app

import android.Manifest
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.net.wifi.p2p.WifiP2pManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.wifi_direct_app.ui.CameraScreen
import com.example.wifi_direct_app.ui.HomeScreen
import com.example.wifi_direct_app.utils.MediaStoreUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class MainActivity : ComponentActivity() {

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
    }

    private val viewModel: MainViewModel by viewModels()

    private lateinit var wifiDirectManager: WiFiDirectManager
    private var receiver: WiFiDirectBroadcastReceiver? = null
    
    private val fileTransferService = FileTransferService()
    private lateinit var fileReceiverService: FileReceiverService
    private val handshakeService = HandshakeService()
    private val permissionService = PermissionService()

    private var targetIpAddress: String? = null

    private val intentFilter = IntentFilter().apply {
        addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION)
        addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION)
        addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION)
        addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        wifiDirectManager = WiFiDirectManager(this)
        fileReceiverService = FileReceiverService(this)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var showCamera by remember { mutableStateOf(false) }

                    if (showCamera) {
                        CameraScreen(
                            onImageCaptured = { path ->
                                showCamera = false
                                viewModel.setCapturedImage(path)
                                requestPermissionsAndInitialize()
                            },
                            onClose = {
                                showCamera = false
                            }
                        )
                    } else {
                        HomeScreen(
                            viewModel = viewModel,
                            onOpenCamera = {
                                val cameraPermission = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                                if (cameraPermission != PackageManager.PERMISSION_GRANTED) {
                                    ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 1002)
                                } else {
                                    showCamera = true
                                }
                            },
                            onAcceptTransfer = {
                                viewModel.setIncomingPermissionRequest(false)
                                replyToPermission("ACCEPT")
                            },
                            onDeclineTransfer = {
                                viewModel.setIncomingPermissionRequest(false)
                                replyToPermission("REJECT")
                            },
                            onConnectDevice = { address, name ->
                                viewModel.setConnectingAddress(address)
                                wifiDirectManager.connectToPeer(address) { success ->
                                    if (!success) {
                                        viewModel.setConnectingAddress(null)
                                        viewModel.updateStatusMessage("Connection failed to $name")
                                    }
                                }
                            },
                            onSendFile = {
                                sendFile()
                            }
                        )
                    }
                }
            }
        }

        handleSendIntent(intent)
        requestPermissionsAndInitialize()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleSendIntent(intent)
    }

    private fun handleSendIntent(intent: Intent?) {
        if (intent == null) return
        if (Intent.ACTION_SEND == intent.action && intent.type?.startsWith("image/") == true) {
            val imageUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            }
            if (imageUri != null) {
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val inputStream: InputStream? = contentResolver.openInputStream(imageUri)
                        val cacheFile = File(cacheDir, "shared_image_${System.currentTimeMillis()}.jpg")
                        val outputStream = FileOutputStream(cacheFile)
                        inputStream?.copyTo(outputStream)
                        inputStream?.close()
                        outputStream.close()

                        withContext(Dispatchers.Main) {
                            viewModel.setCapturedImage(cacheFile.absolutePath)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    private fun requestPermissionsAndInitialize() {
        val permissionsNeeded = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.NEARBY_WIFI_DEVICES)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (permissionsNeeded.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsNeeded.toTypedArray(), PERMISSION_REQUEST_CODE)
        } else {
            initializeWifiDirect()
        }
    }

    private fun initializeWifiDirect() {
        val success = wifiDirectManager.initialize()

        if (success) {
            viewModel.updateInitialized(true, "Scanning for devices...")
            
            fun triggerDiscovery() {
                wifiDirectManager.discoverPeers { started ->
                    if (started) {
                        CoroutineScope(Dispatchers.Main).launch {
                            kotlinx.coroutines.delay(4000)
                            if (!viewModel.uiState.value.isConnected && viewModel.uiState.value.connectingToAddress == null) {
                                wifiDirectManager.requestPeers { }
                            }
                        }
                    }
                }
            }
            
            triggerDiscovery()

            receiver = WiFiDirectBroadcastReceiver(
                wifiDirectManager.getManager(),
                wifiDirectManager.getChannel(),
                onPeersChanged = {
                    wifiDirectManager.requestPeers { peersList ->
                        val peerDevices = peersList.map { 
                            val pMap = it as Map<*, *>
                            PeerDevice(
                                name = pMap["name"] as? String ?: "Unknown",
                                address = pMap["address"] as? String ?: "",
                                status = pMap["status"] as? String ?: "Available"
                            )
                        }
                        
                        val filteredPeers = peerDevices.filter { it.status == "Available" || it.status == "Connected" || it.address == viewModel.uiState.value.connectingToAddress }
                        
                        viewModel.updatePeers(filteredPeers)
                        
                        val isConnectedNow = filteredPeers.any { it.status == "Connected" }
                        
                        if (!isConnectedNow && viewModel.uiState.value.connectingToAddress == null && !viewModel.uiState.value.isConnected) {
                            if (filteredPeers.isEmpty()) {
                                viewModel.updateStatusMessage("Searching nearby...")
                            } else {
                                viewModel.updateStatusMessage("${filteredPeers.size} device(s) found")
                            }
                            CoroutineScope(Dispatchers.Main).launch {
                                kotlinx.coroutines.delay(12000)
                                if (!viewModel.uiState.value.isConnected) triggerDiscovery()
                            }
                        }
                    }
                },
                onConnectionChanged = { isConnected, info ->
                    if (isConnected && info != null) {
                        val goIp = info.groupOwnerAddress?.hostAddress
                        
                        if (info.isGroupOwner) {
                            targetIpAddress = null
                            viewModel.updateConnectionStatus(true, isGroupOwner = true, targetIp = null)
                            
                            handshakeService.startListeningForClientIp { clientIp ->
                                targetIpAddress = clientIp
                                viewModel.updateConnectionStatus(true, isGroupOwner = true, targetIp = clientIp)
                                if (viewModel.uiState.value.capturedImagePath != null) {
                                    requestTransferPermission()
                                }
                            }
                        } else {
                            targetIpAddress = goIp
                            if (goIp != null) {
                                CoroutineScope(Dispatchers.IO).launch {
                                    handshakeService.sendHandshakePing(goIp)
                                }
                            }
                            viewModel.updateConnectionStatus(true, isGroupOwner = false, targetIp = targetIpAddress)
                            if (viewModel.uiState.value.capturedImagePath != null) {
                                requestTransferPermission()
                            }
                        }

                        fileReceiverService.startServer { _, filePath ->
                            CoroutineScope(Dispatchers.Main).launch {
                                viewModel.updateStatusMessage("Photo received!")
                                val savedUri = MediaStoreUtils.saveImageToGallery(this@MainActivity, filePath)
                                if (savedUri != null) {
                                    Toast.makeText(this@MainActivity, "Photo saved to Gallery!", Toast.LENGTH_LONG).show()
                                    try {
                                        val intent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(savedUri, "image/*")
                                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }
                                        startActivity(intent)
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                    }
                                } else {
                                    Toast.makeText(this@MainActivity, "Received photo, but failed to save.", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                        
                        permissionService.startListeningForCommands { command, _ ->
                            CoroutineScope(Dispatchers.Main).launch {
                                val safeCmd = command.trim()
                                if (safeCmd == "REQUEST") {
                                    viewModel.setIncomingPermissionRequest(true)
                                } else if (safeCmd == "ACCEPT") {
                                    viewModel.setRequestingPermission(false)
                                    sendFile()
                                } else if (safeCmd == "REJECT") {
                                    viewModel.setRequestingPermission(false)
                                    viewModel.updateStatusMessage("Transfer declined")
                                    Toast.makeText(this@MainActivity, "Receiver declined transfer", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    } else {
                        targetIpAddress = null
                        handshakeService.stopListening()
                        permissionService.stopListening()
                        fileReceiverService.stopServer()
                        viewModel.updateConnectionStatus(false)
                    }
                }
            )
            
            // Fix for Android 14 (SDK 34): Register receiver with export flag
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(receiver, intentFilter, ContextCompat.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(receiver, intentFilter)
            }
        } else {
            viewModel.updateInitialized(false, "Permission denied")
        }
    }

    private fun requestTransferPermission() {
        if (viewModel.uiState.value.capturedImagePath == null) return
        
        viewModel.setRequestingPermission(true)
        viewModel.updateStatusMessage("Waiting for approval...")
        
        if (targetIpAddress != null) {
            CoroutineScope(Dispatchers.IO).launch {
                val success = permissionService.sendCommand(targetIpAddress!!, "REQUEST")
                withContext(Dispatchers.Main) {
                    if (!success) {
                        viewModel.setRequestingPermission(false)
                        viewModel.updateStatusMessage("Request failed")
                    }
                }
            }
        }
    }

    private fun replyToPermission(response: String) {
        if (targetIpAddress != null) {
            CoroutineScope(Dispatchers.IO).launch {
                permissionService.sendCommand(targetIpAddress!!, response)
            }
        }
    }

    private fun sendFile() {
        val path = viewModel.uiState.value.capturedImagePath ?: return
        
        viewModel.setSending(true)
        viewModel.updateStatusMessage("Sending...")
        
        if (targetIpAddress != null) {
            CoroutineScope(Dispatchers.IO).launch {
                val success = fileTransferService.sendData(targetIpAddress!!, path)
                withContext(Dispatchers.Main) {
                    viewModel.setSending(false)
                    if (success) {
                        viewModel.updateStatusMessage("Sent successfully!")
                        Toast.makeText(this@MainActivity, "Photo sent!", Toast.LENGTH_SHORT).show()
                    } else {
                        viewModel.updateStatusMessage("Send failed")
                        Toast.makeText(this@MainActivity, "Send failed", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                initializeWifiDirect()
            } else {
                viewModel.updateInitialized(false, "Permissions required")
            }
        } else if (requestCode == 1002) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // permission granted
            } else {
                Toast.makeText(this, "Camera permission required.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        receiver?.let { unregisterReceiver(it) }
        fileReceiverService.stopServer()
    }
}
