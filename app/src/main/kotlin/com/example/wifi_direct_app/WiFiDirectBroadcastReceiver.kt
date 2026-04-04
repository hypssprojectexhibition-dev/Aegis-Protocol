package com.example.wifi_direct_app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.NetworkInfo
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.util.Log

class WiFiDirectBroadcastReceiver(
    private val manager: WifiP2pManager,
    private val channel: WifiP2pManager.Channel,
    private val onPeersChanged: () -> Unit,
    private val onConnectionChanged: (Boolean, WifiP2pInfo?) -> Unit
) : BroadcastReceiver() {

    companion object {
        private const val TAG = "WiFiDirectReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION -> {
                val state = intent.getIntExtra(WifiP2pManager.EXTRA_WIFI_STATE, -1)
                val enabled = state == WifiP2pManager.WIFI_P2P_STATE_ENABLED
                Log.d(TAG, "WiFi P2P state changed: enabled=$enabled")
            }
            WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                Log.d(TAG, "Peers changed - requesting peer list")
                onPeersChanged()
            }
            WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION -> {
                Log.d(TAG, "Connection changed")
                val networkInfo: NetworkInfo? = intent.getParcelableExtra(WifiP2pManager.EXTRA_NETWORK_INFO)
                
                if (networkInfo?.isConnected == true) {
                    Log.d(TAG, "Connected to P2P network")
                    
                    // Request connection info to get the Group Owner IP
                    manager.requestConnectionInfo(channel) { info ->
                        Log.d(TAG, "Connection info received: groupOwnerAddress=${info?.groupOwnerAddress?.hostAddress}, isGroupOwner=${info?.isGroupOwner}")
                        onConnectionChanged(true, info)
                    }
                } else {
                    Log.d(TAG, "Disconnected from P2P network")
                    onConnectionChanged(false, null)
                }
            }
            WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION -> {
                Log.d(TAG, "This device changed")
            }
        }
    }
}
