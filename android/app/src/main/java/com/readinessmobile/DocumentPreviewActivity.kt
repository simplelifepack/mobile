package com.readinessmobile

import android.app.Activity
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfRenderer
import android.graphics.BitmapFactory
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.io.File
import java.util.concurrent.Executors

/** Private, in-app PDF/image viewer. Only the visible page is held in memory. */
class DocumentPreviewActivity : Activity() {
  private val worker = Executors.newSingleThreadExecutor()
  private var renderer: PdfRenderer? = null
  private var descriptor: ParcelFileDescriptor? = null
  private lateinit var pageView: PageView
  private lateinit var counter: TextView
  private lateinit var previous: Button
  private lateinit var next: Button
  private var page = 0
  private var pages = 1
  private var closed = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
    val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(Color.rgb(246, 245, 249)) }
    androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
      val bars = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars())
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }
    val header = LinearLayout(this).apply { setPadding(12, 8, 12, 8); gravity = android.view.Gravity.CENTER_VERTICAL }
    header.addView(Button(this).apply { text = "Close"; setOnClickListener { finish() } })
    header.addView(TextView(this).apply { text = intent.getStringExtra("title") ?: "Document"; textSize = 18f; maxLines = 2; setPadding(16, 0, 0, 0) }, LinearLayout.LayoutParams(0, -2, 1f))
    root.addView(header)
    pageView = PageView()
    root.addView(pageView, LinearLayout.LayoutParams(-1, 0, 1f))
    val footer = LinearLayout(this).apply { gravity = android.view.Gravity.CENTER; setPadding(12, 8, 12, 8) }
    previous = Button(this).apply { text = "Previous"; isEnabled = false; setOnClickListener { showPage(page - 1) } }
    next = Button(this).apply { text = "Next"; isEnabled = false; setOnClickListener { showPage(page + 1) } }
    counter = TextView(this).apply { text = "Opening document…"; gravity = android.view.Gravity.CENTER }
    footer.addView(previous)
    footer.addView(counter, LinearLayout.LayoutParams(0, -2, 1f))
    footer.addView(next)
    root.addView(footer)
    setContentView(root)
    androidx.core.view.ViewCompat.requestApplyInsets(root)
    worker.execute {
      try {
        val file = File(intent.getStringExtra("path") ?: "").canonicalFile
        require(file.path.startsWith(File(cacheDir, "readines-preview").canonicalPath + File.separator) && file.isFile) { "This saved copy is unavailable. Close and open the document again." }
        if (intent.getStringExtra("mime") == "application/pdf") {
          descriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
          renderer = PdfRenderer(descriptor!!)
          pages = renderer!!.pageCount
          require(pages > 0) { "This document has no pages." }
          renderPage(0)
        } else {
          val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
          BitmapFactory.decodeFile(file.path, bounds)
          var sample = 1
          while (bounds.outWidth / sample > 2048 || bounds.outHeight / sample > 2048) sample *= 2
          val bitmap = BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
          requireNotNull(bitmap) { "This file cannot be previewed." }
          display(bitmap, 0)
        }
      } catch (error: Exception) { fail() }
    }
  }
  private fun showPage(index: Int) {
    if (index !in 0 until pages || closed) return
    previous.isEnabled = false; next.isEnabled = false
    counter.text = "Opening page ${index + 1}…"
    worker.execute { try { renderPage(index) } catch (error: Exception) { fail() } }
  }
  private fun renderPage(index: Int) {
    renderer!!.openPage(index).use { source ->
      val width = resources.displayMetrics.widthPixels.coerceIn(720, 1600)
      val height = (width.toDouble() * source.height / source.width).toInt().coerceIn(1, 2400)
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      bitmap.eraseColor(Color.WHITE)
      source.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
      display(bitmap, index)
    }
  }
  private fun display(bitmap: Bitmap, index: Int) {
    runOnUiThread {
      if (closed) { bitmap.recycle(); return@runOnUiThread }
      page = index
      pageView.replace(bitmap)
      counter.text = "${page + 1} / $pages"
      previous.visibility = if (pages > 1) View.VISIBLE else View.GONE
      next.visibility = if (pages > 1) View.VISIBLE else View.GONE
      previous.isEnabled = page > 0
      next.isEnabled = page + 1 < pages
    }
  }
  private fun fail() { runOnUiThread { if (!closed) { counter.text = "Couldn’t open this document. Close and try again."; previous.isEnabled = false; next.isEnabled = false } } }
  override fun onDestroy() {
    closed = true
    pageView.replace(null)
    worker.execute { renderer?.close(); descriptor?.close() }
    worker.shutdown()
    super.onDestroy()
  }
  private inner class PageView : View(this@DocumentPreviewActivity) {
    private var bitmap: Bitmap? = null
    private var zoom = 1f
    private var offsetX = 0f
    private var offsetY = 0f
    private var lastX = 0f
    private var lastY = 0f
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    private val detector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
      override fun onScale(detector: ScaleGestureDetector): Boolean { zoom = (zoom * detector.scaleFactor).coerceIn(1f, 4f); invalidate(); return true }
    })
    init { contentDescription = "Document page. Pinch to zoom and drag to move." }
    fun replace(value: Bitmap?) { val old = bitmap; bitmap = value; zoom = 1f; offsetX = 0f; offsetY = 0f; invalidate(); old?.recycle() }
    override fun onDraw(canvas: Canvas) {
      super.onDraw(canvas)
      val image = bitmap ?: return
      val scale = minOf(width.toFloat() / image.width, height.toFloat() / image.height) * zoom
      val w = image.width * scale; val h = image.height * scale
      offsetX = offsetX.coerceIn(-maxOf(0f, (w - width) / 2), maxOf(0f, (w - width) / 2))
      offsetY = offsetY.coerceIn(-maxOf(0f, (h - height) / 2), maxOf(0f, (h - height) / 2))
      canvas.drawBitmap(image, null, android.graphics.RectF((width - w) / 2 + offsetX, (height - h) / 2 + offsetY, (width + w) / 2 + offsetX, (height + h) / 2 + offsetY), paint)
    }
    override fun onTouchEvent(event: MotionEvent): Boolean {
      detector.onTouchEvent(event)
      if (event.actionMasked == MotionEvent.ACTION_MOVE && !detector.isInProgress) { offsetX += event.x - lastX; offsetY += event.y - lastY; invalidate() }
      lastX = event.x; lastY = event.y
      if (event.actionMasked == MotionEvent.ACTION_UP) performClick()
      return true
    }
    override fun performClick(): Boolean { super.performClick(); return true }
  }
}
