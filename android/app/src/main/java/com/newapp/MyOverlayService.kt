package com.newapp

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast

class MyOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: FrameLayout

    override fun onCreate() {
        super.onCreate()

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Create a FrameLayout for the overlay view
        overlayView = FrameLayout(this)
        overlayView.setBackgroundColor(0xFFFFFFFF.toInt())

        // Create and add a TextView
        val textView = TextView(this)
        textView.text = "Incoming Call Detected"
        textView.layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER  // Center the text
        }
        overlayView.addView(textView)

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
