package com.readinessmobile

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.*
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import java.io.File
import java.util.concurrent.Executors

/** Native scanner with document boundary detection, corner adjustment and perspective correction. */
class ReadinessScannerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var pending: Promise? = null
  private var pageLimit = 50
  private val executor = Executors.newSingleThreadExecutor()
  private fun supported(): Boolean {
    val memory = ActivityManager.MemoryInfo()
    (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memory)
    return memory.totalMem >= 1700L * 1024 * 1024 && GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
  }
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != 6175) return
      val promise = pending ?: return
      if (resultCode == Activity.RESULT_CANCELED) { pending = null; promise.resolve(Arguments.createMap().apply { putArray("pages", Arguments.createArray()) }); return }
      if (resultCode != Activity.RESULT_OK) { pending = null; promise.reject("SCAN_FAILED", "Document scan did not complete. Please try again."); return }
      executor.execute {
        val copied = mutableListOf<File>()
        try {
          val result = GmsDocumentScanningResult.fromActivityResultIntent(data)
          val scanned = result?.pages ?: throw IllegalStateException("No scanned pages were returned.")
          require(scanned.isNotEmpty() && scanned.size <= pageLimit) { "The scan exceeds the selected page limit." }
          val folder = File(context.cacheDir, "readines-scan"); check(folder.exists() || folder.mkdirs())
          val pages = Arguments.createArray()
          for ((index, page) in scanned.withIndex()) {
            val target = File.createTempFile("corrected-", ".jpg", folder); copied.add(target)
            context.contentResolver.openInputStream(page.imageUri)?.use { input -> target.outputStream().use { output ->
              val buffer = ByteArray(8192); var total = 0L
              while (true) { val count = input.read(buffer); if (count < 0) break; total += count; require(total <= 10L * 1024 * 1024) { "A scanned page exceeds 10 MB. Scan fewer or smaller pages." }; output.write(buffer, 0, count) }
            } } ?: throw IllegalStateException("Unable to read a scanned page.")
            require(target.length() > 0) { "A scanned page was empty." }
            pages.pushMap(Arguments.createMap().apply { putInt("pageNumber", index + 1); putString("localPath", target.path); putString("mimeType", "image/jpeg") })
          }
          pending = null
          promise.resolve(Arguments.createMap().apply { putArray("pages", pages) })
        } catch (error: Exception) { copied.forEach { it.delete() }; pending = null; promise.reject("SCAN_FAILED", error.message, error) }
      }
    }
  }
  init { context.addActivityEventListener(listener) }
  override fun getName() = "ReadinessDocumentScanner"
  @ReactMethod fun isSupported(promise: Promise) { promise.resolve(supported()) }
  @ReactMethod fun scan(options: ReadableMap, promise: Promise) {
    val activity = context.currentActivity ?: run { promise.reject("UNAVAILABLE", "No active screen."); return }
    if (pending != null) { promise.reject("BUSY", "A document scan is already open."); return }
    if (!supported()) { promise.reject("SCANNER_UNSUPPORTED", "Document scanning needs up-to-date Google Play services and at least 1.7 GB of device memory. Update Google Play services and try again."); return }
    pageLimit = if (options.hasKey("pageLimit")) options.getInt("pageLimit").coerceIn(1, 50) else 50
    val gallery = !options.hasKey("allowGalleryImport") || options.getBoolean("allowGalleryImport")
    val scanner = GmsDocumentScanning.getClient(GmsDocumentScannerOptions.Builder()
      .setPageLimit(pageLimit).setGalleryImportAllowed(gallery)
      .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
      .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL).build())
    pending = promise
    activity.runOnUiThread {
      scanner.getStartScanIntent(activity)
        .addOnSuccessListener { sender ->
          if (pending !== promise) return@addOnSuccessListener
          try { activity.startIntentSenderForResult(sender, 6175, null, 0, 0, 0) }
          catch (error: Exception) { pending = null; promise.reject("SCAN_FAILED", "Unable to open document scanner. Please try again.", error) }
        }
        .addOnFailureListener { error -> pending = null; promise.reject("SCANNER_UNAVAILABLE", "Unable to prepare document scanner. The first scan needs an internet connection to download the scanner. Check Google Play services and try again.", error) }
    }
  }
  override fun invalidate() { context.removeActivityEventListener(listener); pending?.reject("CLOSED", "Scanner closed."); pending = null; executor.shutdown(); super.invalidate() }
}
