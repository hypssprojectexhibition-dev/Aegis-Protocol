package com.example.wifi_direct_app

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket

class HandshakeService {

    companion object {
        private const val TAG = "HandshakeService"
        const val PORT = 8989
    }

    private var serverSocket: ServerSocket? = null
    private var job: Job? = null

    // The Group Owner runs this immediately to listen for the Client
    fun startListeningForClientIp(onClientIpDiscovered: (String) -> Unit) {
        if (job?.isActive == true) return // Thread-safe lock against Android broadcast spam

        job = CoroutineScope(Dispatchers.IO).launch {
            try {
                serverSocket = ServerSocket(PORT)
                Log.d(TAG, "Handshake server listening on port $PORT")

                while (isActive) {
                    val client = serverSocket!!.accept()
                    // INSTEAD of relying on client.inetAddress (which can loopback bug), we read the explicit IP string from the stream!
                    val clientIp = client.getInputStream().bufferedReader().use { it.readText() }
                    
                    Log.d(TAG, "Secret Explicit Handshake received! Client IP is: $clientIp")

                    if (clientIp.isNotEmpty() && clientIp != "127.0.0.1") {
                        withContext(Dispatchers.Main) {
                            onClientIpDiscovered(clientIp)
                        }
                    }
                    client.close()
                    break 
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception in HandshakeService listening: ${e.message}")
            } finally {
                stopListening()
            }
        }
    }

    // The Client runs this immediately to ping the Group Owner with a dummy packet
    suspend fun sendHandshakePing(groupOwnerIp: String): Boolean = withContext(Dispatchers.IO) {
        // Wait 1 second to ensure GO's server socket started up cleanly
        kotlinx.coroutines.delay(1000)
        
        val socket = Socket()
        try {
            Log.d(TAG, "Sending immediate handshake ping to GO: $groupOwnerIp on port $PORT")
            socket.bind(null)
            socket.connect(InetSocketAddress(groupOwnerIp, PORT), 5000)
            
            // Extract our dynamically assigned WiFi Direct IP address from the successful socket route!
            val myExplicitIp = socket.localAddress?.hostAddress ?: ""
            
            val outputStream: OutputStream = socket.getOutputStream()
            outputStream.write(myExplicitIp.toByteArray())
            outputStream.flush()
            
            Log.d(TAG, "Handshake sent successfully, GO now knows my explicit IP: $myExplicitIp!")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Exception while sending handshake ping: ${e.message}")
            false
        } finally {
            if (!socket.isClosed) socket.close()
        }
    }

    fun stopListening() {
        job?.cancel()
        job = null
        try {
            serverSocket?.close()
        } catch (e: Exception) {}
        serverSocket = null
    }
}
