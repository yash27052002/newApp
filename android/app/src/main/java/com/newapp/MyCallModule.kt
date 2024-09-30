package com.newapp // Ensure this matches your actual package name

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
import org.json.JSONArray
import org.json.JSONObject
import android.os.Build // Importing Build
import android.util.Log
import android.content.pm.PackageManager

class MyCallModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MyCallModule"
    }

    // Check if overlay permission is granted
    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
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
                Uri.parse("package:" + reactApplicationContext.packageName)
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    // Start the OverlayService
    @ReactMethod
    fun startOverlayService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(reactApplicationContext)) {
                val serviceIntent = Intent(reactApplicationContext, MyOverlayService::class.java)
                serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startService(serviceIntent)
            } else {
                Toast.makeText(reactApplicationContext, "Overlay permission is required", Toast.LENGTH_LONG).show()
            }
        }
    }

    // Stop the OverlayService
    @ReactMethod
    fun stopOverlayService() {
        val serviceIntent = Intent(reactApplicationContext, MyOverlayService::class.java)
        reactApplicationContext.stopService(serviceIntent)
    }

    @ReactMethod
    fun makeCall(phoneNumber: String) {
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$phoneNumber"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getContacts(page: Int, pageSize: Int, promise: Promise) {
        try {
            val contactsList = JSONArray()
            val contentResolver: ContentResolver = reactApplicationContext.contentResolver
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
        if (reactApplicationContext.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("Permission denied", "READ_PHONE_STATE permission is required to access call logs.")
            return
        }

        try {
            val callLogsList = JSONArray()
            val contentResolver: ContentResolver = reactApplicationContext.contentResolver
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
        reactApplicationContext.startActivity(intent)
    }
}
