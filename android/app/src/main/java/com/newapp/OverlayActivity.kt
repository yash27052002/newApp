package com.newapp

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity

class OverlayActivity : ReactActivity() {
    override fun getMainComponentName(): String {
        return "OverlayComponent" // Ensure this matches the name in your React Native code
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Make the window not focusable so it behaves like an overlay
        window.setFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE)
    }
}
