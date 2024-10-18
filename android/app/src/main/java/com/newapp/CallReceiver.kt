package com.newapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.telephony.TelephonyManager
import android.widget.Toast
import android.os.Build
import android.util.Log

class CallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            Log.d("CallReceiver", "State: $state, Incoming Number: $incomingNumber") // Debug log

            if (state == TelephonyManager.EXTRA_STATE_RINGING) {
                // Check for overlay permission before starting the service
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (Settings.canDrawOverlays(context)) {
                        startOverlayService(context, incomingNumber)
                    } else {
                        // Request overlay permission if not granted
                        Toast.makeText(context, "Please grant overlay permission.", Toast.LENGTH_LONG).show()
                    }
                } else {
                    // For versions below Marshmallow
                    startOverlayService(context, incomingNumber)
                }
            }
        }
    }

    private fun startOverlayService(context: Context, incomingNumber: String?) {
        val serviceIntent = Intent(context, MyOverlayService::class.java).apply {
            putExtra("incoming_number", incomingNumber) // Pass the incoming number
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent) // Use startForegroundService for Android O and above
        } else {
            context.startService(serviceIntent) // For versions below Oreo
        }
    }
}
