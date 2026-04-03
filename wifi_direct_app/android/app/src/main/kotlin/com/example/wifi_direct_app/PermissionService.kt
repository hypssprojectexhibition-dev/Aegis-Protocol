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

class PermissionService {

    companion object {
        private const val TAG = "PermissionService"
        const val PORT = 8990 // Dedicated Out-of-Band port for commands
    }

    private var serverSocket: ServerSocket? = null
    private var job: Job? = null

    // Both devices run this constantly when connected
    fun startListeningForCommands(onCommandReceived: (String, String) -> Unit) {
        if (job?.isActive == true) return // Thread-safe lock against Android broadcast spam

        job = CoroutineScope(Dispatchers.IO).launch {
            try {
                serverSocket = ServerSocket(PORT)
                Log.d(TAG, "Permission Service listening on port $PORT")

                while (isActive) {
                    val client = serverSocket!!.accept()
                    val senderIp = client.inetAddress?.hostAddress ?: ""
                    val command = client.getInputStream().bufferedReader().use { it.readText() }
                    
                    Log.d(TAG, "Received command [$command] from $senderIp")

                    if (command.isNotEmpty()) {
                        withContext(Dispatchers.Main) {
                            onCommandReceived(command, senderIp)
                        }
                    }
                    client.close()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception in PermissionService listening: ${e.message}")
            } finally {
                stopListening()
            }
        }
    }

    // Fire a command string to the target IP
    suspend fun sendCommand(targetIp: String, command: String): Boolean = withContext(Dispatchers.IO) {
        val socket = Socket()
        try {
            Log.d(TAG, "Sending command [$command] to IP: $targetIp on port $PORT")
            socket.bind(null)
            socket.connect(InetSocketAddress(targetIp, PORT), 5000)
            
            val outputStream: OutputStream = socket.getOutputStream()
            outputStream.write(command.toByteArray())
            outputStream.flush()
            
            Log.d(TAG, "Command [$command] sent successfully to $targetIp!")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Exception while sending command [$command]: ${e.message}")
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
