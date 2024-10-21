package com.newapp

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
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import android.util.Log

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
        overlayView.setBackgroundColor(0xFF87CEEB.toInt()) // Sky blue background

        // Create a CardView for displaying API data
        val cardView = CardView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(20, 20, 20, 20)
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

        // Create and add a close button (X)
        val closeButton = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)  // X icon
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.TOP or Gravity.END  // Position at top right
                setMargins(0, 20, 20, 0)  // Set margins: left, top, right, bottom
            }
        }

        // Set up the click listener for the close button
        closeButton.setOnClickListener {
            Toast.makeText(this, "Overlay Closed", Toast.LENGTH_SHORT).show()
            stopSelf()
        }

        // Add close button to overlay view first, then CardView
        overlayView.addView(closeButton)
        overlayView.addView(cardView)

        // Set layout parameters for the overlay
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,  // Width
            WindowManager.LayoutParams.WRAP_CONTENT,  // Height (wrap content)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL // Centered at the top
        windowManager.addView(overlayView, params)
    }

override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Get the incoming number, sender number, and group code from the Intent
    val incomingNumber = intent?.getStringExtra("incoming_number") ?: "Unknown Number"
    val senderNumber = intent?.getStringExtra("phoneNumber") ?: "Unknown Sender"
    val groupCode = intent?.getStringExtra("groupCode") ?: "Unknown GroupCode"

    textView.text = "Incoming Call: $incomingNumber" // Display the incoming number

    // Fetch data from API using the incoming number, sender number, and group code
    fetchDataFromApi(senderNumber, incomingNumber, groupCode)

    return START_STICKY
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

                // Get the response data
                val responseData = it.body?.string()
                mainHandler.post {
                    Log.d("MyOverlayService", "Response Data: $responseData")
                    if (responseData != null) {
                        try {
                            val jsonObject = JSONObject(responseData)
                            val displayData = StringBuilder()

                            // Check if "data" array exists
                            if (jsonObject.has("data")) {
                                val dataArray: JSONArray = jsonObject.getJSONArray("data")

                                // Build the display string for notes
                                for (i in 0 until dataArray.length()) {
                                    val item = dataArray.getString(i)
                                    displayData.append("$item\n")
                                }
                            } 

                            // Check if there's a message in the response
                            if (jsonObject.has("message")) {
                                val message = jsonObject.getString("message")
                                displayData.append(message) // Append the message if it exists
                            }

                            // If no data or message, show a default message
                            if (displayData.isEmpty()) {
                                displayData.append("No notes or messages available.")
                            }

                            textView.text = displayData.toString()
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
