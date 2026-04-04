package com.example.wifi_direct_app

import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStream
import java.net.ServerSocket
import java.net.SocketException

class FileReceiverService(private val context: Context) {

    companion object {
        private const val TAG = "FileReceiverService"
        const val PORT = 8988
    }

    private var serverSocket: ServerSocket? = null
    private var job: Job? = null

    fun startServer(onDataReceived: (String, String) -> Unit) {
        if (job?.isActive == true) return // Thread-safe lock against Android broadcast spam

        job = CoroutineScope(Dispatchers.IO).launch {
            try {
                serverSocket = ServerSocket(PORT)
                Log.d(TAG, "Server socket listening on port $PORT")

                while (isActive) {
                    val client = serverSocket!!.accept()
                    Log.d(TAG, "Client connected, receiving data...")

                    // Save directly to a .jpg file in app's external files dir
                    val fileName = "received_share_${System.currentTimeMillis()}.png"
                    val file = File(context.getExternalFilesDir(null), fileName)
                    val outputStream = java.io.FileOutputStream(file)

                    val inputStream: InputStream = client.getInputStream()
                    inputStream.copyTo(outputStream)
                    
                    outputStream.close()
                    inputStream.close()
                    
                    Log.d(TAG, "File received and saved locally to ${file.absolutePath}")

                    withContext(Dispatchers.Main) {
                        onDataReceived("Image File", file.absolutePath)
                    }

                    client.close()
                }
            } catch (e: SocketException) {
                Log.d(TAG, "Server socket closed or interrupted")
            } catch (e: Exception) {
                Log.e(TAG, "Exception in FileReceiverService: \${e.message}")
            } finally {
                stopServer()
            }
        }
    }

    fun stopServer() {
        job?.cancel()
        job = null
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing server socket: \${e.message}")
        }
        serverSocket = null
    }
}
