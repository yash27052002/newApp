package com.newapp // Ensure this matches your actual package name

import android.app.Service
import android.content.ContentResolver
import android.content.Intent
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import android.provider.Settings
import android.view.LayoutInflater
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import org.json.JSONArray
import org.json.JSONObject
import com.newapp.MyOverlayService

class MyCallModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {


    @ReactMethod
    fun startOverlayService() {
        val intent = Intent(currentActivity, MyOverlayService::class.java)
        currentActivity?.startService(intent)
    }

    override fun getName(): String {
        return "MyCallModule"
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
                        put("callType", callType) // Updated to include call type
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
