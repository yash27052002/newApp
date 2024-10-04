package com.newapp

import android.app.Service
import android.content.BroadcastReceiver
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import android.provider.Settings
import android.telephony.TelephonyManager
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject
import android.os.Build
import android.content.pm.PackageManager
import android.content.IntentFilter

class MyCallModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context: ReactApplicationContext = reactContext
    private var callStateReceiver: CallStateReceiver? = null
    private var listenerCount = 0

    override fun getName(): String {
        return "MyCallModule"
    }

    init {
        // Register the CallStateReceiver
        callStateReceiver = CallStateReceiver()
        val intentFilter = IntentFilter()
        intentFilter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
        context.registerReceiver(callStateReceiver, intentFilter)
    }

    // CallStateReceiver to listen for call state changes
    private inner class CallStateReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)

            if (state == TelephonyManager.EXTRA_STATE_IDLE) {
                // Notify React Native when a call ends
                sendEvent("CallEnded", null)
            }
        }
    }

    // Implementing addListener
    fun addListener(eventName: String) {
        if (eventName == "CallEnded") {
            listenerCount++
        }
    }

    // Implementing removeListeners
    fun removeListeners(count: Int) {
        listenerCount = (listenerCount - count).coerceAtLeast(0)
    }

    // Check if overlay permission is granted
    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(context))
        } else {
            promise.resolve(true)
        }
    }

    // Request the overlay permission if not granted
    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + context.packageName)
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }

    // Start the OverlayService
    @ReactMethod
    fun startOverlayService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, MyOverlayService::class.java)
                serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startService(serviceIntent)
            } else {
                Toast.makeText(context, "Overlay permission is required", Toast.LENGTH_LONG).show()
            }
        }
    }

    // Stop the OverlayService
    @ReactMethod
    fun stopOverlayService() {
        val serviceIntent = Intent(context, MyOverlayService::class.java)
        context.stopService(serviceIntent)
    }

    @ReactMethod
    fun makeCall(phoneNumber: String) {
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$phoneNumber"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    @ReactMethod
    fun getContacts(page: Int, pageSize: Int, promise: Promise) {
        try {
            val contactsList = JSONArray()
            val contentResolver: ContentResolver = context.contentResolver
            val cursor = contentResolver.query(
                ContactsContract.Contacts.CONTENT_URI,
                null,
                null,
                null,
                null
            )

            cursor?.use {
                val nameIndex = it.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME)
                val idIndex = it.getColumnIndex(ContactsContract.Contacts._ID)
                val start = (page - 1) * pageSize
                val end = start + pageSize

                var index = 0
                while (it.moveToNext()) {
                    if (index >= end) break
                    if (index >= start) {
                        val id = it.getString(idIndex)
                        val name = it.getString(nameIndex)
                        val contactJson = JSONObject().apply {
                            put("id", id)
                            put("name", name)
                        }
                        contactsList.put(contactJson)

                        // Fetch phone numbers
                        val phoneCursor = contentResolver.query(
                            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                            null,
                            "${ContactsContract.CommonDataKinds.Phone.CONTACT_ID} = ?",
                            arrayOf(id),
                            null
                        )
                        phoneCursor?.use { phones ->
                            val phoneNumberIndex = phones.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                            while (phones.moveToNext()) {
                                val phoneNumber = phones.getString(phoneNumberIndex)
                                contactJson.put("phoneNumber", phoneNumber)
                            }
                        }
                    }
                    index++
                }
            }

            promise.resolve(contactsList.toString())
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }

    @ReactMethod
    fun getCallLogs(promise: Promise) {
        // Check for READ_PHONE_STATE permission
        if (context.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("Permission denied", "READ_PHONE_STATE permission is required to access call logs.")
            return
        }

        try {
            val callLogsList = JSONArray()
            val contentResolver: ContentResolver = context.contentResolver
            val cursor = contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                null,
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )

            cursor?.use {
                val numberIndex = it.getColumnIndex(CallLog.Calls.NUMBER)
                val nameIndex = it.getColumnIndex(CallLog.Calls.CACHED_NAME)
                val typeIndex = it.getColumnIndex(CallLog.Calls.TYPE)
                val dateIndex = it.getColumnIndex(CallLog.Calls.DATE)
                val durationIndex = it.getColumnIndex(CallLog.Calls.DURATION)

                while (it.moveToNext()) {
                    val number = it.getString(numberIndex)
                    val name = it.getString(nameIndex) ?: "Unknown"
                    val type = it.getInt(typeIndex)
                    val date = it.getLong(dateIndex)
                    val duration = it.getLong(durationIndex)

                    // Determine the call type
                    val callType = when (type) {
                        CallLog.Calls.INCOMING_TYPE -> "incoming"
                        CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                        CallLog.Calls.MISSED_TYPE -> "missed"
                        CallLog.Calls.VOICEMAIL_TYPE -> "voicemail"
                        CallLog.Calls.REJECTED_TYPE -> "declined"
                        else -> "unknown"
                    }

                    val callLogJson = JSONObject().apply {
                        put("number", number)
                        put("name", name)
                        put("callType", callType)
                        put("date", date)
                        put("duration", duration)
                    }
                    callLogsList.put(callLogJson)
                }
            }

            promise.resolve(callLogsList.toString())
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }

    @ReactMethod
    fun openDefaultDialerSettings() {
        val intent = Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun sendEvent(eventName: String, params: Any?) {
        if (context.hasActiveCatalystInstance() && listenerCount > 0) {
            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
