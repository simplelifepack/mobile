package com.readinessmobile

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.spec.MGF1ParameterSpec
import java.security.spec.X509EncodedKeySpec
import java.util.concurrent.Executors
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import javax.crypto.spec.SecretKeySpec

class ReadinessFilesModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var biometricPending: Promise? = null
  private var biometricPrompt: BiometricPrompt? = null
  @ReactMethod fun authenticateBiometry(promise: Promise) {
    val activity = context.currentActivity as? FragmentActivity ?: run { promise.reject("UNAVAILABLE", "No active screen for biometric verification."); return }
    activity.runOnUiThread {
      if (biometricPending != null) { promise.reject("BUSY", "Biometric verification is already open."); return@runOnUiThread }
      if (BiometricManager.from(activity).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) != BiometricManager.BIOMETRIC_SUCCESS) {
        promise.reject("BIOMETRY_UNAVAILABLE", "Biometrics are unavailable. Use your R-pin."); return@runOnUiThread
      }
      biometricPending = promise
      try {
        val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), object : BiometricPrompt.AuthenticationCallback() {
          override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
            val pending = biometricPending; biometricPending = null; biometricPrompt = null; pending?.resolve(true)
          }
          override fun onAuthenticationError(code: Int, message: CharSequence) {
            val pending = biometricPending; biometricPending = null; biometricPrompt = null; pending?.reject("BIOMETRY_CANCELLED", "Biometric verification did not complete. Use your R-pin or try again.")
          }
        })
        biometricPrompt = prompt
        prompt.authenticate(BiometricPrompt.PromptInfo.Builder().setTitle("Unlock Readines").setSubtitle("Verify to open your private archive").setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG).setNegativeButtonText("Use R-pin").build())
      } catch (error: Exception) {
        biometricPending = null; biometricPrompt = null; promise.reject("BIOMETRY_UNAVAILABLE", "Unable to open biometric verification. Use your R-pin.", error)
      }
    }
  }
  private var pending: Promise? = null
  private val executor = Executors.newSingleThreadExecutor()
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != 6174) return
      val promise = pending ?: return
      if (resultCode == Activity.RESULT_CANCELED) { pending = null; promise.resolve(Arguments.createArray()); return }
      if (resultCode != Activity.RESULT_OK) { pending = null; promise.reject("PICK_FAILED", "File selection did not complete. Please try again."); return }
      executor.execute {
        val copied = mutableListOf<File>()
        try {
          val uris = mutableListOf<Uri>()
          data?.clipData?.let { clip -> for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri) }
          if (uris.isEmpty()) data?.data?.let { uris.add(it) }
          require(uris.size <= 50) { "Select at most 50 files." }
          val result = Arguments.createArray()
          for (uri in uris) {
            var name = "document"
            context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor -> if (cursor.moveToFirst()) name = cursor.getString(0) ?: name }
            val mime = context.contentResolver.getType(uri) ?: "application/octet-stream"
            require(mime in listOf("application/pdf", "image/jpeg", "image/png", "image/webp")) { "Choose PDF, JPEG, PNG or WebP files." }
            val target = File.createTempFile("readines-pick-", ".tmp", context.cacheDir)
            copied.add(target)
            try {
              context.contentResolver.openInputStream(uri)!!.use { input -> target.outputStream().use { output ->
                val buffer = ByteArray(8192); var total = 0L
                while (true) { val count = input.read(buffer); if (count < 0) break; total += count; require(total <= 10 * 1024 * 1024) { "Files must be 10 MB or smaller." }; output.write(buffer, 0, count) }
              } }
              require(target.length() > 0) { "This file is empty. Choose another file." }
              result.pushMap(Arguments.createMap().apply { putString("uri", Uri.fromFile(target).toString()); putString("name", name); putString("type", mime); putDouble("size", target.length().toDouble()) })
            } catch (error: Exception) { target.delete(); throw error }
          }
          pending = null; promise.resolve(result)
        } catch (error: Exception) { copied.forEach { it.delete() }; pending = null; promise.reject("PICK_FAILED", error.message, error) }
      }
    }
  }
  init { context.addActivityEventListener(listener) }
  override fun getName() = "ReadinessFiles"
  @ReactMethod fun pick(promise: Promise) {
    val activity = context.currentActivity ?: run { promise.reject("UNAVAILABLE", "No active screen."); return }
    if (pending != null) { promise.reject("BUSY", "A file picker is already open."); return }
    pending = promise
    try { activity.startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "*/*"; putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/pdf", "image/jpeg", "image/png", "image/webp")); putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true) }, 6174) }
    catch (error: Exception) { pending = null; promise.reject("PICK_FAILED", error.message, error) }
  }
  @ReactMethod fun pickGallery(promise: Promise) {
    val activity = context.currentActivity ?: run { promise.reject("UNAVAILABLE", "No active screen."); return }
    if (pending != null) { promise.reject("BUSY", "A picker is already open."); return }
    pending = promise
    try { activity.startActivityForResult(Intent(Intent.ACTION_GET_CONTENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "image/*"; putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/jpeg", "image/png", "image/webp")); putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true) }, 6174) }
    catch (error: Exception) { pending = null; promise.reject("PICK_FAILED", error.message, error) }
  }
  @ReactMethod fun encrypt(file: ReadableMap, pem: String, promise: Promise) {
    executor.execute {
      var bytes: ByteArray? = null; var key: ByteArray? = null
      try {
        val uri = Uri.parse(file.getString("uri")); require(uri.scheme == "file") { "Invalid file URI." }
        val source = File(uri.path!!).canonicalFile
        require(source.path.startsWith(context.cacheDir.canonicalPath + File.separator)) { "Upload file must be in private cache." }
        require(source.length() in 1..(10L * 1024 * 1024)) { "Invalid file size." }
        bytes = source.readBytes(); key = ByteArray(32).also { SecureRandom().nextBytes(it) }
        val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
        val aes = Cipher.getInstance("AES/GCM/NoPadding"); aes.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(128, iv))
        val encrypted = aes.doFinal(bytes)
        val der = Base64.decode(pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace(Regex("\\s"), ""), Base64.DEFAULT)
        val rsaKey = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(der))
        require((rsaKey as java.security.interfaces.RSAPublicKey).modulus.bitLength() == 4096) { "Unsupported encryption key size." }
        val rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
        rsa.init(Cipher.ENCRYPT_MODE, rsaKey, OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT))
        val wrapped = rsa.doFinal(key)
        val target = File.createTempFile("readines-encrypted-", ".readines", context.cacheDir); target.writeBytes(encrypted)
        fun b64(value: ByteArray) = Base64.encodeToString(value, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        fun hash(value: ByteArray) = MessageDigest.getInstance("SHA-256").digest(value).joinToString("") { "%02x".format(it) }
        promise.resolve(Arguments.createMap().apply { putString("uri", Uri.fromFile(target).toString()); putString("iv", b64(iv)); putString("wrappedKey", b64(wrapped)); putString("originalSha256", hash(bytes!!)); putString("encryptedSha256", hash(encrypted)) })
      } catch (error: Exception) { promise.reject("ENCRYPT_FAILED", error.message, error) }
      finally { bytes?.fill(0); key?.fill(0) }
    }
  }
  @ReactMethod fun createPdf(text: String, title: String, promise: Promise) {
    executor.execute {
      try {
        val folder = File(context.cacheDir, "readines-preview"); folder.mkdirs()
        val target = File.createTempFile("readines-", ".pdf", folder)
        val pdf = android.graphics.pdf.PdfDocument()
        try {
          val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { textSize = 12f; color = android.graphics.Color.BLACK }
          val lines = mutableListOf<String>()
          for (paragraph in (title + "\n\n" + text).split("\n")) {
            if (paragraph.isEmpty()) { lines.add(""); continue }
            var remaining = paragraph
            while (remaining.isNotEmpty()) {
              var count = paint.breakText(remaining, true, 510f, null).coerceAtLeast(1)
              if (count < remaining.length) { val space = remaining.lastIndexOf(' ', count - 1); if (space > 0) count = space }
              lines.add(remaining.substring(0, count)); remaining = remaining.substring(count).trimStart()
            }
          }
          for ((index, chunk) in lines.chunked(39).withIndex()) {
            val page = pdf.startPage(android.graphics.pdf.PdfDocument.PageInfo.Builder(595, 842, index + 1).create())
            chunk.forEachIndexed { line, value -> page.canvas.drawText(value, 42f, 54f + line * 19f, paint) }
            pdf.finishPage(page)
          }
          target.outputStream().use { pdf.writeTo(it) }
        } finally { pdf.close() }
        promise.resolve(target.path)
      } catch (error: Exception) { promise.reject("PDF_FAILED", error.message, error) }
    }
  }
  @ReactMethod fun preview(path: String, mime: String, title: String, promise: Promise) {
    try {
      val file = File(path).canonicalFile
      require(file.path.startsWith(File(context.cacheDir, "readines-preview").canonicalPath + File.separator) && file.isFile) { "The saved document is unavailable. Open it again." }
      val activity = context.currentActivity ?: error("No active screen.")
      activity.runOnUiThread {
        try {
          activity.startActivity(Intent(activity, DocumentPreviewActivity::class.java).apply {
            putExtra("path", file.path); putExtra("mime", mime); putExtra("title", title)
          })
          promise.resolve(null)
        } catch (error: Exception) { promise.reject("PREVIEW_FAILED", "Couldn’t open this document. Try again.", error) }
      }
    } catch (error: Exception) { promise.reject("PREVIEW_FAILED", error.message, error) }
  }
  @ReactMethod fun open(path: String, mime: String, promise: Promise) {
    try {
      val file = File(path).canonicalFile
      require(file.path.startsWith(File(context.cacheDir, "readines-preview").canonicalPath + File.separator)) { "Invalid preview path." }
      val uri = FileProvider.getUriForFile(context, context.packageName + ".readines.files", file)
      context.startActivity(Intent.createChooser(Intent(Intent.ACTION_VIEW).apply { setDataAndType(uri, mime); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) }, "Open document").apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION) })
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("OPEN_FAILED", error.message, error) }
  }
  override fun invalidate() {
    context.removeActivityEventListener(listener); pending?.reject("CLOSED", "File picker closed."); pending = null
    val auth = biometricPending; biometricPending = null; auth?.reject("CLOSED", "Biometric verification closed.")
    ContextCompat.getMainExecutor(context).execute { biometricPrompt?.cancelAuthentication(); biometricPrompt = null }
    executor.shutdown(); super.invalidate()
  }
}
class ReadinessFilesPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ReadinessFilesModule(context), ReadinessScannerModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
