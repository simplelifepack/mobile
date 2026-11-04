import Foundation
import UIKit
import QuickLook
import UniformTypeIdentifiers
import CryptoKit
import Security
import AVFoundation
import VisionKit
import PhotosUI
import React

private final class ReadinessPreviewItem: NSObject, QLPreviewItem {
  let previewItemURL: URL?
  let previewItemTitle: String?
  init(url: URL, title: String) { previewItemURL = url; previewItemTitle = title; super.init() }
}
private final class ReadinessFilePreview: QLPreviewController, QLPreviewControllerDataSource {
  private let item: ReadinessPreviewItem
  init(item: ReadinessPreviewItem) {
    self.item = item
    super.init(nibName: nil, bundle: nil)
    dataSource = self
  }
  required init?(coder: NSCoder) { return nil }
  func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { item }
}

@objc(ReadinessFiles)
class ReadinessFiles: NSObject, UIDocumentPickerDelegate, PHPickerViewControllerDelegate {
  private var pending: RCTPromiseResolveBlock?
  private var failure: RCTPromiseRejectBlock?
  @objc static func requiresMainQueueSetup() -> Bool { true }
  private func uploadDirectory() throws -> URL {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent("readines-upload", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    return directory
  }
  private func controller() -> UIViewController? {
    var vc = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }.first { $0.isKeyWindow }?.rootViewController
    while let next = vc?.presentedViewController { vc = next }
    return vc
  }
  @objc(pick:rejecter:)
  func pick(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard self.pending == nil else { reject("BUSY", "A file picker is already open.", nil); return }
      guard let vc = self.controller() else { reject("UNAVAILABLE", "No active window.", nil); return }
      self.pending = resolve; self.failure = reject
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .jpeg, .png, UTType("org.webmproject.webp") ?? .image], asCopy: true)
      picker.allowsMultipleSelection = true; picker.delegate = self
      vc.present(picker, animated: true)
    }
  }
  @objc(pickGallery:rejecter:)
  func pickGallery(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard self.pending == nil else { reject("BUSY", "A picker is already open.", nil); return }
      guard let vc = self.controller() else { reject("UNAVAILABLE", "No active window.", nil); return }
      self.pending = resolve; self.failure = reject
      var config = PHPickerConfiguration(); config.filter = .images; config.selectionLimit = 50
      let picker = PHPickerViewController(configuration: config); picker.delegate = self
      vc.present(picker, animated: true)
    }
  }
  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true) {
      // Import one image at a time rather than decoding up to 50 images together.
      self.importGallery(results, index: 0, files: [], bytes: 0)
    }
  }
  private func importGallery(_ results: [PHPickerResult], index: Int, files: [[String: Any]], bytes: Int) {
    guard index < results.count else {
      DispatchQueue.main.async { self.pending?(files); self.pending = nil; self.failure = nil }
      return
    }
    results[index].itemProvider.loadObject(ofClass: UIImage.self) { object, error in
      var written: URL?
      do {
        let file: [String: Any] = try autoreleasepool {
          guard let image = object as? UIImage, let data = image.jpegData(compressionQuality: 0.9) else { throw error ?? NSError(domain: "Gallery", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unable to read this photo. Try downloading it first or choose another photo."]) }
          guard bytes + data.count <= 10 * 1024 * 1024 else { throw NSError(domain: "Gallery", code: 2, userInfo: [NSLocalizedDescriptionKey: "Selected images exceed 10 MB. Choose fewer or smaller photos."]) }
          let url = try self.uploadDirectory().appendingPathComponent(UUID().uuidString + ".jpg")
          written = url
          try data.write(to: url, options: [.atomic, .completeFileProtection])
          return ["uri": url.absoluteString, "name": "photo-\(index + 1).jpg", "type": "image/jpeg", "size": data.count]
        }
        self.importGallery(results, index: index + 1, files: files + [file], bytes: bytes + (file["size"] as? Int ?? 0))
      } catch {
        if let url = written { try? FileManager.default.removeItem(at: url) }
        for file in files { if let uri = file["uri"] as? String, let url = URL(string: uri) { try? FileManager.default.removeItem(at: url) } }
        DispatchQueue.main.async { self.failure?("PICK_FAILED", error.localizedDescription, error); self.pending = nil; self.failure = nil }
      }
    }
  }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    controller.dismiss(animated: true) { self.pending?([]); self.pending = nil; self.failure = nil }
  }
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    var copied = [URL]()
    do {
      guard urls.count <= 50 else { throw NSError(domain: "Files", code: 1, userInfo: [NSLocalizedDescriptionKey: "Select at most 50 files."]) }
      let result: [[String: Any]] = try urls.map { url in
        let access = url.startAccessingSecurityScopedResource(); defer { if access { url.stopAccessingSecurityScopedResource() } }
        let info = try url.resourceValues(forKeys: [.fileSizeKey, .contentTypeKey])
        guard let size = info.fileSize, size > 0, size <= 10 * 1024 * 1024 else { throw NSError(domain: "Files", code: 2, userInfo: [NSLocalizedDescriptionKey: "Choose non-empty files of 10 MB or smaller."]) }
        let target = try self.uploadDirectory().appendingPathComponent(UUID().uuidString + "." + url.pathExtension)
        copied.append(target)
        try FileManager.default.copyItem(at: url, to: target)
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: target.path)
        return ["uri": target.absoluteString, "name": url.lastPathComponent, "type": info.contentType?.preferredMIMEType ?? "application/octet-stream", "size": info.fileSize ?? 0]
      }
      controller.dismiss(animated: true) { self.pending?(result); self.pending = nil; self.failure = nil }
    } catch {
      copied.forEach { try? FileManager.default.removeItem(at: $0) }
      controller.dismiss(animated: true) { self.failure?("PICK_FAILED", error.localizedDescription, error); self.pending = nil; self.failure = nil }
    }
  }
  private func rsaBytes(_ data: Data) throws -> Data {
    // SecKey consumes PKCS#1 RSA bytes; the backend publishes an SPKI envelope.
    let bytes = [UInt8](data); var index = 0
    func read() throws -> (UInt8, Int, Int) {
      guard index + 2 <= bytes.count else { throw NSError(domain: "Key", code: 1) }
      let tag = bytes[index]; index += 1; var length = Int(bytes[index]); index += 1
      if length & 128 != 0 { let count = length & 127; guard count > 0 && count <= 4 && index + count <= bytes.count else { throw NSError(domain: "Key", code: 2) }; length = 0; for _ in 0..<count { length = length * 256 + Int(bytes[index]); index += 1 } }
      guard index + length <= bytes.count else { throw NSError(domain: "Key", code: 3) }; return (tag, index, length)
    }
    let outer = try read(); guard outer.0 == 0x30 else { throw NSError(domain: "Key", code: 4) }
    let algorithm = try read(); index = algorithm.1 + algorithm.2
    let bitString = try read(); guard bitString.0 == 3 && bitString.2 > 1 && bytes[bitString.1] == 0 else { throw NSError(domain: "Key", code: 5) }
    return Data(bytes[(bitString.1 + 1)..<(bitString.1 + bitString.2)])
  }
  @objc(encrypt:pem:resolver:rejecter:)
  func encrypt(_ file: NSDictionary, pem: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        guard let uri = file["uri"] as? String, let url = URL(string: uri), url.isFileURL else { throw NSError(domain: "Files", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid upload file."]) }
        let sourcePath = url.resolvingSymlinksInPath().path
        let cachePath = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].resolvingSymlinksInPath().path + "/"
        let temporaryPath = FileManager.default.temporaryDirectory.resolvingSymlinksInPath().path + "/"
        guard sourcePath.hasPrefix(cachePath) || sourcePath.hasPrefix(temporaryPath) else { throw NSError(domain: "Files", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid upload file."]) }
        let bytes = try Data(contentsOf: url)
        guard bytes.count > 0 && bytes.count <= 10 * 1024 * 1024 else { throw NSError(domain: "Files", code: 4, userInfo: [NSLocalizedDescriptionKey: "Invalid file size."]) }
        let clean = pem.replacingOccurrences(of: "-----BEGIN PUBLIC KEY-----", with: "").replacingOccurrences(of: "-----END PUBLIC KEY-----", with: "").filter { !$0.isWhitespace }
        guard let der = Data(base64Encoded: clean) else { throw NSError(domain: "Key", code: 6) }
        var keyError: Unmanaged<CFError>?
        guard let publicKey = SecKeyCreateWithData(try self.rsaBytes(der) as CFData, [kSecAttrKeyType: kSecAttrKeyTypeRSA, kSecAttrKeyClass: kSecAttrKeyClassPublic, kSecAttrKeySizeInBits: 4096] as CFDictionary, &keyError) else { throw keyError!.takeRetainedValue() as Error }
        let key = SymmetricKey(size: .bits256); let nonce = AES.GCM.Nonce(); let sealed = try AES.GCM.seal(bytes, using: key, nonce: nonce)
        let rawKey = key.withUnsafeBytes { Data($0) }
        guard let wrapped = SecKeyCreateEncryptedData(publicKey, .rsaEncryptionOAEPSHA256, rawKey as CFData, &keyError) as Data? else { throw keyError!.takeRetainedValue() as Error }
        let ciphertext = sealed.ciphertext + sealed.tag
        let target = try self.uploadDirectory().appendingPathComponent(UUID().uuidString + ".readines")
        try ciphertext.write(to: target, options: [.atomic, .completeFileProtection])
        func b64(_ data: Data) -> String { data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "") }
        func hash(_ data: Data) -> String { SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined() }
        resolve(["uri": target.absoluteString, "iv": b64(Data(nonce)), "wrappedKey": b64(wrapped), "originalSha256": hash(bytes), "encryptedSha256": hash(ciphertext)])
      } catch { reject("ENCRYPT_FAILED", error.localizedDescription, error) }
    }
  }
  @objc(createPdf:title:resolver:rejecter:)
  func createPdf(_ text: String, title: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("readines-preview", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let url = directory.appendingPathComponent(UUID().uuidString + ".pdf")
        let font = UIFont.systemFont(ofSize: 12)
        let attributes: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.black]
        var lines: [String] = []
        for paragraph in (title + "\n\n" + text).components(separatedBy: "\n") {
          var line = ""
          for word in paragraph.components(separatedBy: " ") {
            let candidate = line.isEmpty ? word : line + " " + word
            if (candidate as NSString).size(withAttributes: attributes).width > 510 && !line.isEmpty { lines.append(line); line = word } else { line = candidate }
          }
          lines.append(line)
        }
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 595, height: 842))
        try renderer.writePDF(to: url) { context in
          var y: CGFloat = 820
          for line in lines {
            if y > 790 { context.beginPage(); y = 42 }
            (line as NSString).draw(at: CGPoint(x: 42, y: y), withAttributes: attributes)
            y += 19
          }
        }
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: url.path)
        resolve(url.path)
      } catch { reject("PDF_FAILED", error.localizedDescription, error) }
    }
  }
  @objc(preview:mime:title:resolver:rejecter:)
  func preview(_ path: String, mime: String, title: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let vc = self.controller() else { reject("UNAVAILABLE", "No active window.", nil); return }
      let url = URL(fileURLWithPath: path)
      guard FileManager.default.fileExists(atPath: url.path) else { reject("FILE_MISSING", "The preview file is no longer available. Open it again.", nil); return }
      let item = ReadinessPreviewItem(url: url, title: title)
      guard QLPreviewController.canPreview(item) else { reject("UNSUPPORTED_PREVIEW", "This file cannot be previewed. Download it instead.", nil); return }
      let preview = ReadinessFilePreview(item: item)
      vc.present(preview, animated: true) { resolve(nil) }
    }
  }
  @objc(open:mime:resolver:rejecter:)
  func open(_ path: String, mime: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { guard let vc = self.controller() else { reject("UNAVAILABLE", "No active window.", nil); return }; let sheet = UIActivityViewController(activityItems: [URL(fileURLWithPath: path)], applicationActivities: nil); sheet.popoverPresentationController?.sourceView = vc.view; vc.present(sheet, animated: true); resolve(nil) }
  }
}

@objc(ReadinessDocumentScanner)
class ReadinessDocumentScanner: NSObject, VNDocumentCameraViewControllerDelegate {
  private var pending: RCTPromiseResolveBlock?
  private var failure: RCTPromiseRejectBlock?
  private var pageLimit = 50
  @objc static func requiresMainQueueSetup() -> Bool { true }
  @objc(isSupported:rejecter:)
  func isSupported(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) { resolve(VNDocumentCameraViewController.isSupported) }
  @objc(scan:resolver:rejecter:)
  func scan(_ options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard self.pending == nil else { reject("BUSY", "A document scan is already open.", nil); return }
#if targetEnvironment(simulator)
      reject("SCANNER_UNSUPPORTED", "Live document scanning needs a physical iPhone or iPad camera. The iOS simulator cannot detect page borders or capture scans. Use Upload files or From gallery here.", nil)
      return
#else
      guard VNDocumentCameraViewController.isSupported else { reject("SCANNER_UNSUPPORTED", "This device does not support document scanning. Use Upload files or From gallery.", nil); return }
      self.pending = resolve; self.failure = reject
      self.pageLimit = min(50, max(1, (options["pageLimit"] as? NSNumber)?.intValue ?? 50))
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized: self.presentScanner()
      case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in DispatchQueue.main.async { if granted { self.presentScanner() } else { self.fail("CAMERA_PERMISSION", "Allow camera access in Settings to scan documents.") } } }
      case .denied: self.fail("CAMERA_PERMISSION", "Camera access is disabled. Allow camera access for Readines in Settings to scan documents.")
      case .restricted: self.fail("CAMERA_RESTRICTED", "Camera access is restricted by Screen Time or your device administrator. Use Upload files or From gallery, or ask the device administrator to allow the camera.")
      @unknown default: self.fail("CAMERA_UNAVAILABLE", "Camera access is unavailable. Use Upload files or From gallery.")
      }
#endif
    }
  }
  private func fail(_ code: String, _ message: String) { failure?(code, message, nil); pending = nil; failure = nil }
  private func presentScanner() {
    var vc = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }.first { $0.isKeyWindow }?.rootViewController
    while let next = vc?.presentedViewController { vc = next }
    guard let vc = vc, !vc.isBeingDismissed else { fail("UNAVAILABLE", "Wait for the current screen to close, then try scanning again."); return }
    let camera = VNDocumentCameraViewController(); camera.delegate = self
    vc.present(camera, animated: true)
  }
  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true) { self.pending?(["pages": []]); self.pending = nil; self.failure = nil }
  }
  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
    controller.dismiss(animated: true) {
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .denied: self.fail("CAMERA_PERMISSION", "Camera access was disabled. Allow Camera for Readines in Settings and try scanning again.")
      case .restricted: self.fail("CAMERA_RESTRICTED", "Camera access is restricted by Screen Time or your device administrator.")
      default: self.fail("SCAN_FAILED", error.localizedDescription)
      }
    }
  }
  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
    var written = [URL]()
    do {
      guard scan.pageCount > 0 && scan.pageCount <= pageLimit else { throw NSError(domain: "Scan", code: 1, userInfo: [NSLocalizedDescriptionKey: "Scan at most \(pageLimit) pages."]) }
      let folder = FileManager.default.temporaryDirectory.appendingPathComponent("readines-upload", isDirectory: true)
      try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
      let pages: [[String: Any]] = try (0..<scan.pageCount).map { index in
        try autoreleasepool {
          // VisionKit returns the user's cropped, perspective-corrected page.
          guard let data = scan.imageOfPage(at: index).jpegData(compressionQuality: 0.9) else { throw NSError(domain: "Scan", code: 2) }
          guard data.count <= 10 * 1024 * 1024 else { throw NSError(domain: "Scan", code: 3, userInfo: [NSLocalizedDescriptionKey: "A scanned page exceeds 10 MB. Scan fewer or smaller pages."]) }
          let url = folder.appendingPathComponent(UUID().uuidString + ".jpg")
          try data.write(to: url, options: [.atomic, .completeFileProtection]); written.append(url)
          return ["pageNumber": index + 1, "localPath": url.path, "mimeType": "image/jpeg"]
        }
      }
      controller.dismiss(animated: true) { self.pending?(["pages": pages]); self.pending = nil; self.failure = nil }
    } catch {
      written.forEach { try? FileManager.default.removeItem(at: $0) }
      controller.dismiss(animated: true) { self.fail("SCAN_FAILED", error.localizedDescription) }
    }
  }
}
