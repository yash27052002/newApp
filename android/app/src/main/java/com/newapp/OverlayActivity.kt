package com.newapp

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity

class OverlayActivity : ReactActivity() {
    override fun getMainComponentName(): String {
        return "OverlayComponent" // Replace with your actual component name registered in React Native
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE)
    }
}
