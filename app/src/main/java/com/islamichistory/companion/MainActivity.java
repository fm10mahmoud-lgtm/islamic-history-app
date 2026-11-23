package com.islamichistory.companion;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** يعرض صفحة assets/index.html بالكامل داخل WebView (يعمل دون إنترنت). */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#064E3B"));
        w.setNavigationBarColor(Color.parseColor("#064E3B"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#064E3B"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // لحفظ التقدم والوضع الليلي
        s.setMediaPlaybackRequiresUserGesture(false); // مؤثرات Tone.js الصوتية
        s.setAllowFileAccess(true);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);

        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return false; // كل التنقل داخلي
            }
        });

        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        // نسأل الصفحة أولاً: هل تعاملت مع زر الرجوع (إغلاق نافذة / العودة للرئيسية)؟
        web.evaluateJavascript(
            "(function(){return window.handleAndroidBack ? window.handleAndroidBack() : false;})()",
            value -> {
                if (!"true".equals(value)) {
                    finish();
                }
            });
    }

    @Override
    protected void onPause()  { super.onPause();  if (web != null) web.onPause(); }
    @Override
    protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override
    protected void onDestroy() { if (web != null) { web.destroy(); } super.onDestroy(); }
}
