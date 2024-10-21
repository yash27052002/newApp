package com.newapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.telephony.TelephonyManager
import android.widget.Toast
import android.os.Build
import android.util.Log
import android.net.Uri

class CallReceiver : BroadcastReceiver() {

    private var senderNumber: String? = null // Store the user phone number

    fun setsenderNumber(phoneNumber: String) {
        senderNumber = phoneNumber
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            Log.d("CallReceiver", "State: $state, Incoming Number: $incomingNumber")

            if (state == TelephonyManager.EXTRA_STATE_RINGING) {
                // Check for overlay permission before starting the service
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (Settings.canDrawOverlays(context)) {
                        startOverlayService(context, incomingNumber)
                    } else {
                        Toast.makeText(context, "Please grant overlay permission.", Toast.LENGTH_LONG).show()
                        val permissionIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
                        context.startActivity(permissionIntent)
                    }
                } else {
                    startOverlayService(context, incomingNumber)
                }
            }
        }
    }

    private fun startOverlayService(context: Context, incomingNumber: String?) {
        val serviceIntent = Intent(context, MyOverlayService::class.java).apply {
            putExtra("incoming_number", incomingNumber) // Pass the incoming number
            putExtra("sender_number", senderNumber) // Pass the sender number
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
