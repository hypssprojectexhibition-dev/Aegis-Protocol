package com.example.wifi_direct_app

import android.util.Log
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FileTransferService {

    companion object {
        private const val TAG = "FileTransferService"
        const val PORT = 8988
    }

    suspend fun sendData(hostAddress: String, filePath: String): Boolean = withContext(Dispatchers.IO) {
        val socket = Socket()
        try {
            Log.d(TAG, "Opening client socket - host: $hostAddress port: $PORT")
            socket.bind(null)
            socket.connect(InetSocketAddress(hostAddress, PORT), 5000)

            Log.d(TAG, "Client socket connected, sending file: $filePath")
            val outputStream: OutputStream = socket.getOutputStream()
            val file = java.io.File(filePath)
            val inputStream = java.io.FileInputStream(file)
            
            inputStream.copyTo(outputStream)
            inputStream.close()
            outputStream.flush()
            
            Log.d(TAG, "File sent successfully")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Exception while sending data: ${e.message}")
            false
        } finally {
            if (!socket.isClosed) {
                try {
                    socket.close()
                } catch (e: Exception) {
                    Log.e(TAG, "Error closing socket: ${e.message}")
                }
            }
        }
    }
}
