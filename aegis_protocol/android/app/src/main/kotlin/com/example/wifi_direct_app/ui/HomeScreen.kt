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
                    SendBar(
                        isSending = state.isSending,
                        isRequesting = state.isRequestingPermission,
                        onSend = onSendFile
                    )
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
        IncomingRequestDialog(onAcceptTransfer, onDeclineTransfer)
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
fun IncomingRequestDialog(onAccept: () -> Unit, onDecline: () -> Unit) {
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
                    onClick = onAccept,
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = C.accent)
                ) {
                    Text("Accept", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
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
