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
        Log.d("CallReceiver", "Received intent: ${intent.action}")
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) // Extract the incoming number
            Log.d("CallReceiver", "Phone state: $state, Incoming number: $incomingNumber")

            if (state == TelephonyManager.EXTRA_STATE_RINGING) {
                // Check for overlay permission before starting the service
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (Settings.canDrawOverlays(context)) {
                        val serviceIntent = Intent(context, MyOverlayService::class.java).apply {
                            putExtra("incoming_number", incomingNumber) // Pass the incoming number
                        }
                        serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startService(serviceIntent)
                    } else {
                        Toast.makeText(context, "Overlay permission is required", Toast.LENGTH_LONG).show()
                    }
                } else {
                    // For versions below Android Marshmallow, start the service directly
                    val serviceIntent = Intent(context, MyOverlayService::class.java).apply {
                        putExtra("incoming_number", incomingNumber) // Pass the incoming number
                    }
                    context.startService(serviceIntent)
                }
            }
        }
    }
}
