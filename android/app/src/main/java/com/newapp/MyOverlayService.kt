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
        overlayView.setBackgroundColor(0xFFFFFFFF.toInt())

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
            setCardBackgroundColor(0xFFFFFFFF.toInt())  // Background color
            cardElevation = 8f  // Elevation for shadow
        }

        // Create and add a TextView for displaying API data
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
        val closeButton = ImageView(this)
        closeButton.setImageResource(android.R.drawable.ic_menu_close_clear_cancel)  // X icon
        closeButton.layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END  // Position at top right
            setMargins(0, 20, 20, 0)  // Set margins: left, top, right, bottom
        }

        // Set up the click listener for the close button
        closeButton.setOnClickListener {
            Toast.makeText(this, "Overlay Closed", Toast.LENGTH_SHORT).show()
            stopSelf()
        }

        // Add CardView and close button to the overlay view
        overlayView.addView(cardView)
        overlayView.addView(closeButton)

        // Set layout parameters for the overlay
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,  // Width
            600,  // Height (fixed value in pixels)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.CENTER
        windowManager.addView(overlayView, params)

        // Fetch data from API
        fetchDataFromApi()
    }

    private fun fetchDataFromApi() {
        val client = OkHttpClient()
        val request = Request.Builder()
            .url("https://59ce90a6-8a50-4d6c-a859-b2995b664793.mock.pstmn.io/data/notes") // Your API URL
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
                // Update UI with an error message
                mainHandler.post {
                    textView.text = "Error fetching data"
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!it.isSuccessful) throw IOException("Unexpected code $it")

                    // Get the response data
                    val responseData = it.body?.string()

                    // Update the UI on the main thread
                    mainHandler.post {
                        try {
                            val jsonObject = JSONObject(responseData)
                            val dataArray: JSONArray = jsonObject.getJSONArray("data")

                            // Build the display string
                            val displayData = StringBuilder()
                            for (i in 0 until dataArray.length()) {
                                val item = dataArray.getString(i)
                                displayData.append("$item\n")
                            }

                            textView.text = displayData.toString()
                        } catch (e: Exception) {
                            textView.text = "Error parsing data"
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

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?) = null
}