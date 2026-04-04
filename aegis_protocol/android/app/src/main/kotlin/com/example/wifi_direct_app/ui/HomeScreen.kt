package com.example.wifi_direct_app.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.outlined.BrokenImage
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.rememberAsyncImagePainter
import com.example.wifi_direct_app.MainViewModel
import kotlinx.coroutines.flow.collectLatest
import java.io.File

object C {
    val bg = Color(0xFFF6F5F3)
    val card = Color.White
    val text = Color(0xFF1A1A1A)
    val textMuted = Color(0xFF8E8E93)
    val accent = Color(0xFFE8715A)
    val accentSoft = Color(0xFFFFF0ED)
    val green = Color(0xFF34C759)
    val greenSoft = Color(0xFFE8F9ED)
    val border = Color(0xFFE8E8E6)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onOpenCamera: () -> Unit,
    onAcceptTransfer: () -> Unit,
    onDeclineTransfer: () -> Unit,
    onConnectDevice: (String, String) -> Unit,
    onSendFile: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var showReceivedDialog by remember { mutableStateOf<String?>(null) }
    
    LaunchedEffect(state.permissionRequestPending) {
        // Will show incoming dialog using standard declarative Compose based on state
    }

    Scaffold(
        containerColor = C.bg,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Aegis Protocol",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = C.text,
                        letterSpacing = (-0.8).sp
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = C.bg)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                StatusRow(
                    message = state.statusMessage,
                    isConnected = state.isConnected,
                    isInitialized = state.isInitialized
                )
            }

            item {
                if (state.capturedImagePath != null) {
                    PhotoCard(
                        imagePath = state.capturedImagePath!!,
                        onRetake = onOpenCamera
                    )
                } else {
                    EmptyPhotoCard(onCapture = onOpenCamera)
                }
            }

            if (state.isConnected && state.capturedImagePath != null && state.targetIp != null) {
                item {
                    if (state.isProcessingCrypto) {
                        Surface(
                            color = C.card,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth().height(100.dp)
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                CircularProgressIndicator(color = C.accent, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("Encrypting & Splitting...", fontSize = 14.sp, color = C.textMuted)
                            }
                        }
                    } else {
                        SendBar(
                            isSending = state.isSending || state.isUploadingShare,
                            isRequesting = state.isRequestingPermission,
                            onSend = onSendFile
                        )
                    }
                }
                
                // --- Transfer Code Display (auto-generated) ---
                if (state.generatedTransferCode != null) {
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        Surface(
                            color = C.card,
                            shape = RoundedCornerShape(16.dp),
                            shadowElevation = 1.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    "Security Code",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = C.textMuted
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                Text(
                                    state.generatedTransferCode!!,
                                    fontSize = 36.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = C.accent,
                                    letterSpacing = 6.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Share this code with the receiver",
                                    fontSize = 12.sp,
                                    color = C.textMuted
                                )
                            }
                        }
                    }
                }
            }

            // --- Receiver Side: Share 2 Received, Waiting for OTP ---
            if (state.share2Path != null && state.reconstructedBitmap == null) {
                item {
                    Surface(
                        color = C.card,
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, C.accent.copy(alpha = 0.3f))
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Surface(color = C.accentSoft, shape = RoundedCornerShape(12.dp), modifier = Modifier.size(52.dp)) {
                                Text("🔒", fontSize = 24.sp, modifier = Modifier.wrapContentSize())
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Received Encrypted Share", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = C.text)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Enter the 6-digit passcode to reconstruct", fontSize = 13.sp, color = C.textMuted)
                            
                            Spacer(modifier = Modifier.height(24.dp))
                            
                            var otpValue by remember { mutableStateOf("") }
                            OutlinedTextField(
                                value = otpValue,
                                onValueChange = { if (it.length <= 6) otpValue = it },
                                label = { Text("Passcode") },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth().height(64.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = C.accent,
                                    unfocusedBorderColor = C.border
                                )
                            )
                            
                            if (state.codeVerificationError != null) {
                                Text(state.codeVerificationError!!, color = Color.Red, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
                            }
                            
                            Spacer(modifier = Modifier.height(20.dp))
                            
                            Button(
                                onClick = { 
                                    viewModel.verifyAndReconstruct(otpValue, state.share2Path!!)
                                },
                                modifier = Modifier.fillMaxWidth().height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = C.green),
                                enabled = !state.isVerifyingCode && !state.isDownloadingShare
                            ) {
                                if (state.isVerifyingCode || state.isDownloadingShare) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                                } else {
                                    Text("Verify & Decrypt", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // --- Reconstruction Success ---
            if (state.reconstructedBitmap != null) {
                item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Surface(
                            color = C.card,
                            shape = RoundedCornerShape(24.dp),
                            modifier = Modifier.fillMaxWidth().height(320.dp),
                            shadowElevation = 4.dp
                        ) {
                            Image(
                                bitmap = state.reconstructedBitmap!!.asImageBitmap(),
                                contentDescription = "Decrypted photo",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Spacer(modifier = Modifier.height(20.dp))
                        Text("Photo Decrypted Successfully! 🎉", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = C.green)
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            var saved by remember { mutableStateOf(false) }
                            val context = LocalContext.current
                            
                            Button(
                                onClick = { 
                                    if(!saved) {
                                        viewModel.saveReconstructedImageToGallery(context)
                                        saved = true
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = if (saved) C.green else C.accent)
                            ) {
                                Text(if (saved) "Saved ✓" else "Save to Gallery", color = Color.White)
                            }
                            
                            Button(
                                onClick = { viewModel.resetForNewTransfer() },
                                colors = ButtonDefaults.buttonColors(containerColor = C.text)
                            ) {
                                Text("Done")
                            }
                        }
                    }
                }
            }

            if (state.isInitialized && state.capturedImagePath != null) {
                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Devices", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = C.text)
                        if (state.peers.isNotEmpty()) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = C.accentSoft,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.padding(vertical = 2.dp)
                            ) {
                                Text(
                                    "${state.peers.size}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = C.accent,
                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }
                
                if (state.peers.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            CircularProgressIndicator(color = Color.LightGray, strokeWidth = 2.5.dp, modifier = Modifier.size(28.dp))
                            Spacer(modifier = Modifier.height(14.dp))
                            Text("Searching nearby...", color = Color.Gray, fontSize = 14.sp)
                        }
                    }
                }
            } else if (state.isInitialized && state.capturedImagePath == null) {
                item {
                    Text(
                        "Take a photo to see nearby devices",
                        color = Color.Gray,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 20.dp)
                    )
                }
            }
            
            if (state.isInitialized && state.capturedImagePath != null) {
                items(state.peers) { peer ->
                    val isConnecting = peer.address == state.connectingToAddress && !state.isConnected
                    val isConnected = (peer.status == "Connected") || (state.isConnected && peer.address == state.connectingToAddress)
                    
                    if (state.isConnected && !isConnected && peer.address != state.connectingToAddress) {
                        // Return nothing if connected to another device
                        return@items
                    }
                    
                    DeviceCard(
                        name = peer.name,
                        address = peer.address,
                        status = peer.status,
                        isConnected = isConnected,
                        isConnecting = isConnecting,
                        onTap = {
                            if (!state.isConnected && state.connectingToAddress == null) {
                                onConnectDevice(peer.address, peer.name)
                            }
                        }
                    )
                }
                item {
                    Spacer(modifier = Modifier.height(40.dp))
                }
            }
        }
    }

    if (state.permissionRequestPending) {
        IncomingRequestDialog(viewModel, onAcceptTransfer, onDeclineTransfer)
    }
}

@Composable
fun StatusRow(message: String, isConnected: Boolean, isInitialized: Boolean) {
    val dotColor = if (isConnected) C.green else if (isInitialized) C.accent else C.textMuted
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).background(dotColor, CircleShape))
        Spacer(modifier = Modifier.width(10.dp))
        Text(message, color = C.textMuted, fontSize = 14.sp, fontWeight = FontWeight.Medium)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncomingRequestDialog(viewModel: MainViewModel, onAccept: () -> Unit, onDecline: () -> Unit) {
    val state by viewModel.uiState.collectAsState()
    var enteredCode by remember { mutableStateOf("") }
    var showCodeEntry by remember { mutableStateOf(false) }
    
    ModalBottomSheet(
        onDismissRequest = onDecline,
        containerColor = Color.White,
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 24.dp, end = 24.dp, top = 20.dp, bottom = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(Modifier.width(36.dp).height(4.dp).background(C.border, RoundedCornerShape(2.dp)))
            Spacer(modifier = Modifier.height(28.dp))
            Surface(color = C.accentSoft, shape = RoundedCornerShape(16.dp), modifier = Modifier.size(56.dp)) {
                Icon(Icons.Outlined.BrokenImage, "Photo", tint = C.accent, modifier = Modifier.padding(14.dp))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("Incoming photo", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = C.text)
            Spacer(modifier = Modifier.height(6.dp))
            
            if (!showCodeEntry) {
                // Stage 1: Accept or Decline
                Text("Someone wants to send you a photo", fontSize = 14.sp, color = C.textMuted)
                Spacer(modifier = Modifier.height(28.dp))
                Row {
                    OutlinedButton(
                        onClick = onDecline,
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Decline", color = C.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = { showCodeEntry = true },
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = C.accent)
                    ) {
                        Text("Accept", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            } else {
                // Stage 2: Enter security code
                Text("Enter the sender's security code", fontSize = 14.sp, color = C.textMuted)
                
                Spacer(modifier = Modifier.height(20.dp))
                
                OutlinedTextField(
                    value = enteredCode,
                    onValueChange = { if (it.length <= 6) enteredCode = it },
                    label = { Text("6-digit code") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = C.card,
                        focusedContainerColor = C.card,
                        unfocusedBorderColor = C.border,
                        focusedBorderColor = C.accent,
                        unfocusedTextColor = C.text,
                        focusedTextColor = C.text
                    ),
                    singleLine = true
                )
                
                if (state.codeVerificationError != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(state.codeVerificationError!!, fontSize = 13.sp, color = Color(0xFFD32F2F))
                }
                
                Spacer(modifier = Modifier.height(28.dp))
                Row {
                    OutlinedButton(
                        onClick = { showCodeEntry = false },
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Back", color = C.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = {
                            viewModel.verifyTransferCode(enteredCode) {
                                onAccept()
                            }
                        },
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = C.green),
                        enabled = !state.isVerifyingCode
                    ) {
                        if (state.isVerifyingCode) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Verify", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyPhotoCard(onCapture: () -> Unit) {
    Surface(
        onClick = onCapture,
        modifier = Modifier.fillMaxWidth().height(200.dp),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, C.border),
        color = Color.White
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Surface(color = C.accentSoft, shape = RoundedCornerShape(16.dp), modifier = Modifier.size(56.dp)) {
                // Placeholder icon
                Text("📷", fontSize = 26.sp, modifier = Modifier.wrapContentSize())
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text("Tap to take a photo", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = C.text)
            Spacer(modifier = Modifier.height(4.dp))
            Text("or share one from your gallery", fontSize = 13.sp, color = C.textMuted)
        }
    }
}

@Composable
fun PhotoCard(imagePath: String, onRetake: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp)
            .clip(RoundedCornerShape(20.dp))
    ) {
        AsyncImage(
            model = File(imagePath),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )
        // Simulate dark gradient bottom
        Box(modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp).clickable { onRetake() }) {
            Surface(
                color = Color.White.copy(alpha = 0.2f),
                shape = RoundedCornerShape(10.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
            ) {
                Row(modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("🔄", fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Retake", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun SendBar(isSending: Boolean, isRequesting: Boolean, onSend: () -> Unit) {
    val busy = isSending || isRequesting
    val label = if (isSending) "Sending..." else if (isRequesting) "Waiting for approval..." else "Send Photo"
    Button(
        onClick = { if (!busy) onSend() },
        modifier = Modifier.fillMaxWidth().height(54.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = C.accent, disabledContainerColor = C.accent.copy(alpha = 0.5f))
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (busy) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
            } else {
                Icon(Icons.AutoMirrored.Rounded.ArrowForward, contentDescription = null, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Text(label, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun DeviceCard(name: String, address: String, status: String, isConnected: Boolean, isConnecting: Boolean, onTap: () -> Unit) {
    Surface(
        onClick = onTap,
        color = if (isConnected) C.greenSoft else Color.White,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, if (isConnected) C.green.copy(alpha = 0.3f) else C.border)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = if (isConnected) C.green.copy(alpha = 0.12f) else C.bg,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.size(42.dp)
            ) {
                Text(if (isConnected) "🔗" else "📱", modifier = Modifier.wrapContentSize())
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(name, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = C.text)
                Spacer(modifier = Modifier.height(2.dp))
                Text(address, fontSize = 12.sp, color = C.textMuted)
            }
            if (isConnecting) {
                CircularProgressIndicator(color = C.accent, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
            } else {
                Surface(
                    color = if (isConnected) C.green.copy(alpha = 0.1f) else if (status == "Available") C.accentSoft else C.bg,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        status,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isConnected) C.green else if (status == "Available") C.accent else C.textMuted,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}
