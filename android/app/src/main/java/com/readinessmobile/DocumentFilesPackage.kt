package com.readinessmobile

import android.content.ClipData
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
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

class DocumentFilesPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(DocumentFilesModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}

class DocumentFilesModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "DocumentFiles"

  private fun cacheFile(path: String): File {
    val file = File(path.removePrefix("file://")).canonicalFile
    require(file.parentFile == context.cacheDir.canonicalFile && file.isFile) {
      "The document is not available in the app cache."
    }
    return file
  }

  private fun shareRoot(): File {
    val root = File(context.cacheDir, "document-shares")
    if (!root.exists() && !root.mkdirs()) throw IllegalStateException("Unable to prepare the share cache.")
    val cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
    root.listFiles()?.filter { it.lastModified() < cutoff }?.forEach {
      if (!it.deleteRecursively()) Log.w("DocumentFiles", "Unable to remove expired share cache")
    }
    return root
  }

  /** Opens the system share sheet for one cached document using a read-only content URI. */
  @ReactMethod
  fun shareFile(path: String, name: String, mimeType: String, promise: Promise) {
    var shareDir: File? = null
    try {
      val activity = context.currentActivity ?: throw IllegalStateException("No active screen is available to share the document.")
      val source = cacheFile(path)
      shareDir = File(shareRoot(), UUID.randomUUID().toString())
      if (!shareDir.mkdir()) throw IllegalStateException("Unable to prepare the share cache.")
      val copy = File(shareDir, File(name).name.ifBlank { source.name })
      source.copyTo(copy)
      val uri = FileProvider.getUriForFile(context, "${context.packageName}.visitpackshare", copy)
      val intent = Intent(Intent.ACTION_SEND).apply {
        type = mimeType.ifBlank { "application/octet-stream" }
        putExtra(Intent.EXTRA_STREAM, uri)
        clipData = ClipData.newRawUri("Document", uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      activity.startActivity(Intent.createChooser(intent, "Share document"))
      promise.resolve(null)
    } catch (error: Exception) {
      if (shareDir != null && !shareDir.deleteRecursively()) Log.w("DocumentFiles", "Unable to remove failed share cache")
      promise.reject("DOCUMENT_SHARE_FAILED", error.message, error)
    }
  }

  /** Renders one PDF page to a PNG in the app cache and resolves with its path. */
  @ReactMethod
  fun renderPdfPage(path: String, pageIndex: Int, promise: Promise) {
    Thread {
      var descriptor: ParcelFileDescriptor? = null
      try {
        val source = cacheFile(path)
        descriptor = ParcelFileDescriptor.open(source, ParcelFileDescriptor.MODE_READ_ONLY)
        PdfRenderer(descriptor).use { renderer ->
          require(pageIndex in 0 until renderer.pageCount) { "That page is not available." }
          renderer.openPage(pageIndex).use { page ->
            val scale = 2
            val bitmap = Bitmap.createBitmap(page.width * scale, page.height * scale, Bitmap.Config.ARGB_8888)
            bitmap.eraseColor(Color.WHITE)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            val output = File(context.cacheDir, "document-page-${UUID.randomUUID()}.png")
            output.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            bitmap.recycle()
            promise.resolve(output.absolutePath)
          }
        }
      } catch (error: Exception) {
        promise.reject("DOCUMENT_RENDER_FAILED", error.message, error)
      } finally {
        descriptor?.close()
      }
    }.start()
  }
}
