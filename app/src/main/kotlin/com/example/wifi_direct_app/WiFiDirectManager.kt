package com.example.wifi_direct_app

import android.annotation.SuppressLint
import android.content.Context
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.util.Log

class WiFiDirectManager(private val context: Context) {

    companion object {
        private const val TAG = "WiFiDirectManager"
    }

    private lateinit var manager: WifiP2pManager
    private lateinit var channel: WifiP2pManager.Channel

    var isInitialized: Boolean = false
        private set

    // Stores discovered peers
    private val peers = mutableListOf<WifiP2pDevice>()
    var currentConnectionInfo: WifiP2pInfo? = null
        private set

    fun initialize(): Boolean {
        return try {
            manager = context.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
            channel = manager.initialize(context, context.mainLooper, null)
            isInitialized = true
            Log.d(TAG, "WiFi Direct initialized successfully")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize WiFi Direct: ${e.message}")
            isInitialized = false
            false
        }
    }

    @SuppressLint("MissingPermission")
    fun discoverPeers(callback: (Boolean) -> Unit) {
        if (!isInitialized) {
            callback(false)
            return
        }

        manager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Peer discovery started")
                callback(true)
            }

            override fun onFailure(reason: Int) {
                Log.e(TAG, "Peer discovery failed: reason=$reason")
                callback(false)
            }
        })
    }

    @SuppressLint("MissingPermission")
    fun requestPeers(callback: (List<Map<String, String>>) -> Unit) {
        if (!isInitialized) {
            callback(emptyList())
            return
        }

        manager.requestPeers(channel) { peerList ->
            peers.clear()
            peers.addAll(peerList.deviceList)
            Log.d(TAG, "Found ${peers.size} peers")

            val peerMaps = peers.map { device ->
                mapOf(
                    "name" to (device.deviceName ?: "Unknown"),
                    "address" to device.deviceAddress,
                    "status" to getDeviceStatus(device.status)
                )
            }
            callback(peerMaps)
        }
    }

    @SuppressLint("MissingPermission")
    fun connectToPeer(deviceAddress: String, callback: (Boolean) -> Unit) {
        if (!isInitialized) {
            callback(false)
            return
        }

        val config = WifiP2pConfig().apply {
            this.deviceAddress = deviceAddress
            // Important: This makes it a standard connection rather than forcing a group owner
        }

        manager.connect(channel, config, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Connection sequence initiated")
                // Success here only means the connection *request* was initiated successfully.
                // Actual connection result comes via broadcast receiver.
                callback(true)
            }

            override fun onFailure(reason: Int) {
                Log.e(TAG, "Connection initiation failed: reason=$reason")
                callback(false)
            }
        })
    }

    @SuppressLint("MissingPermission")
    fun disconnect(callback: (Boolean) -> Unit) {
        if (!isInitialized) {
            callback(false)
            return
        }
        manager.removeGroup(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Successfully disconnected and removed old group")
                callback(true)
            }
            override fun onFailure(reason: Int) {
                Log.e(TAG, "Failed to disconnect: reason=$reason")
                callback(false)
            }
        })
    }

    fun requestConnectionInfo(callback: (WifiP2pInfo) -> Unit) {
        if (!isInitialized) return
        
        manager.requestConnectionInfo(channel) { info ->
            currentConnectionInfo = info
            callback(info)
        }
    }

    private fun getDeviceStatus(statusCode: Int): String {
        return when (statusCode) {
            WifiP2pDevice.AVAILABLE -> "Available"
            WifiP2pDevice.INVITED -> "Invited"
            WifiP2pDevice.CONNECTED -> "Connected"
            WifiP2pDevice.FAILED -> "Failed"
            WifiP2pDevice.UNAVAILABLE -> "Unavailable"
            else -> "Unknown"
        }
    }

    fun getManager(): WifiP2pManager = manager
    fun getChannel(): WifiP2pManager.Channel = channel
}
