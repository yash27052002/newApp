package com.newapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import androidx.core.app.NotificationCompat
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException
import android.util.Log
import android.content.Context

class MyOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: FrameLayout
    private lateinit var textView: TextView

    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Create a FrameLayout for the overlay view
        overlayView = FrameLayout(this)

        // Create a CardView for displaying API data
        val cardView = CardView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                400 // Increased height of CardView (adjust as needed)
            ).apply {
                gravity = Gravity.CENTER // Center the CardView
                setMargins(20, 20, 20, 20)  // Set margins for better visibility
            }
            radius = 16f  // Rounded corners
            setCardBackgroundColor(0xFFFFFFFF.toInt())  // White background color
            cardElevation = 8f  // Elevation for shadow
        }

        // Create and add a TextView for displaying the incoming number
        textView = TextView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(20, 20, 20, 20)  // Add some margins for better visibility
            }
            setPadding(20, 20, 20, 20)  // Padding inside the TextView
            textSize = 25f  // Font size
            setTextColor(0xFF000000.toInt())  // Text color
        }

        // Add TextView to CardView
        cardView.addView(textView)

        // Create and add a close button (X) inside the CardView
        val closeButton = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)  // X icon
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.TOP or Gravity.END  // Position at top right inside CardView
                setMargins(20, 20, 20, 0)  // Set margins for the close button
            }
        }

        // Set up the click listener for the close button
        closeButton.setOnClickListener {
            Toast.makeText(this, "Overlay Closed", Toast.LENGTH_SHORT).show()
            stopSelf()
        }

        // Add close button to CardView
        cardView.addView(closeButton)

        // Add CardView to overlay view
        overlayView.addView(cardView)

        // Set layout parameters for the overlay
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,  // Width
            WindowManager.LayoutParams.MATCH_PARENT,  // Height (fill parent)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.CENTER // Centered in the screen

        // Add touch listener to the overlay view to close it when touched outside the card
        overlayView.setOnTouchListener { v, event ->
            if (event.action == android.view.MotionEvent.ACTION_OUTSIDE) {
                Toast.makeText(this, "Overlay Closed", Toast.LENGTH_SHORT).show()
                stopSelf()
                true
            } else {
                false
            }
        }

        windowManager.addView(overlayView, params)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Get the incoming number and group code from the Intent
        val incomingNumber = intent?.getStringExtra("incoming_number") ?: "Unknown Number"

        // Retrieve the stored sender number from SharedPreferences
        val sharedPreferences = getSharedPreferences("MyAppPrefs", Context.MODE_PRIVATE)
        val senderNumber = sharedPreferences.getString("userPhoneNumber", "Unknown Sender") ?: "Unknown Sender"
        val groupCode = sharedPreferences.getString("groupCode", "Unknown GroupCode") ?: "Unknown GroupCode"

        // Fetch data from API using the incoming number, sender number, and group code
        fetchDataFromApi(senderNumber, incomingNumber, groupCode)

        // Start the foreground service
        startForegroundService()

        return START_STICKY
    }

    private fun startForegroundService() {
        val notification = createNotification() // Create a notification for the foreground service
        startForeground(1, notification) // Use a unique ID for the notification
    }

    private fun createNotification(): Notification {
        val builder = NotificationCompat.Builder(this, "your_channel_id")
            .setContentTitle("Overlay Service Running")
            .setContentText("Your overlay service is active.")
            .setSmallIcon(R.drawable.ic_notification) // replace with your own icon
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)

        // Create the notification channel if API level >= 26
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "your_channel_id",
                "Overlay Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }

        return builder.build()
    }

    private fun fetchDataFromApi(senderNumber: String, receiverNumber: String, groupCode: String) {
        val client = OkHttpClient()
        val url = "https://www.annulartech.net/notes/getNotes?senderNumber=$senderNumber&receiverNumber=$receiverNumber&groupCode=$groupCode"
        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
                mainHandler.post {
                    textView.text = "Error fetching data"
                }
            }

            override fun onResponse(call: Call, response: Response) {
    response.use {
        if (!it.isSuccessful) {
            mainHandler.post {
                textView.text = "Unexpected response: ${it.code}"
            }
            return
        }

        val responseData = it.body?.string()
        mainHandler.post {
            Log.d("MyOverlayService", "Response Data: $responseData")
            if (responseData != null) {
                try {
                    val jsonObject = JSONObject(responseData)

                    // Check the status field
                    val status = jsonObject.getInt("status")
                    if (status == 0) {
                        // Check if "data" is present and not null
                        if (!jsonObject.isNull("data")) {
                            val data = jsonObject.getJSONObject("data")

                            // Directly retrieve and display the "notes" field
                            val notes = data.getString("notes")
                            textView.text = notes  // Display the notes directly
                        } else {
                            textView.text = "Error: Data is null"
                        }
                    } else {
                        // Status is not 0, display the message
                        val message = jsonObject.getString("message")
                        textView.text = message
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    textView.text = "Error parsing data: ${e.message}"
                }
            } else {
                textView.text = "Error: No response data"
            }
        }
    }
}

        })
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::windowManager.isInitialized && ::overlayView.isInitialized) {
            windowManager.removeView(overlayView)
        }
    }

    override fun onBind(intent: Intent?) = null
}
