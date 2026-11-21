package com.readinessmobile

import android.content.ClipData
import android.content.Intent
import android.util.Log
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.util.UUID

class VisitPackSharePackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(VisitPackShareModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}

class VisitPackShareModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "VisitPackShare"

  @ReactMethod
  fun shareZip(path: String, name: String, promise: Promise) {
    var shareDir: File? = null
    try {
      val activity = context.currentActivity ?: throw IllegalStateException("No active screen is available to share the ZIP.")
      val source = File(path).canonicalFile
      require(source.parentFile == context.cacheDir.canonicalFile && source.isFile) {
        "The visit packet is not available in the app cache."
      }
      require(name == File(name).name && name.endsWith(".zip")) { "Invalid visit packet name." }
      val root = File(context.cacheDir, "visit-pack-shares")
      if (!root.exists() && !root.mkdirs()) throw IllegalStateException("Unable to prepare the share cache.")
      val cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
      root.listFiles()?.filter { it.lastModified() < cutoff }?.forEach {
        if (!it.deleteRecursively()) Log.w("VisitPackShare", "Unable to remove expired share cache")
      }
      shareDir = File(root, UUID.randomUUID().toString())
      if (!shareDir.mkdir()) throw IllegalStateException("Unable to prepare the share cache.")
      val copy = File(shareDir, name)
      source.copyTo(copy)
      val uri = FileProvider.getUriForFile(context, "${context.packageName}.visitpackshare", copy)
      val intent = Intent(Intent.ACTION_SEND).apply {
        type = "application/zip"
        putExtra(Intent.EXTRA_STREAM, uri)
        clipData = ClipData.newRawUri("Visit packet", uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      activity.startActivity(Intent.createChooser(intent, "Share visit packet"))
      promise.resolve(null)
    } catch (error: Exception) {
      if (shareDir != null && !shareDir.deleteRecursively()) Log.w("VisitPackShare", "Unable to remove failed share cache")
      promise.reject("VISIT_PACK_SHARE_FAILED", error.message, error)
    }
  }
}
