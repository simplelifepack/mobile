# Web versus iOS and Android functionality audit

Date: 27 October 2026.

## Conclusion and scope

Full web functionality is **not yet complete on mobile**. The main modules exist in the shared React Native app, but several web workflows are missing or reduced. The implementation gaps below apply to both iOS and Android unless stated otherwise.

Compared the current local working copies of `frontend-web`, `readiness-mobile`, and relevant backend routing. All three repositories are on `main` and contain existing uncommitted changes. This describes those working copies, including untracked implementation files, not released App Store/Play Store builds or deployed web behavior. No application code or account data was changed for this audit.

Method: reviewed web route components, mobile navigation and screen actions, API callers, native link/file setup, backend integration mounts, and retained QA evidence. API methods or registered screens alone were not counted as usable completed workflows. This is a source audit, not a fresh interactive end-to-end certification. Mobile `npm run typecheck` passed during this audit.

## Coverage by module

| Area | Present in mobile | Assessment |
| --- | --- | --- |
| Authentication/security | Signup OTP, password/PIN/Google sign-in code, PIN setup/change/reset, password reset by OTP, email/password changes, session controls, biometric app lock | Broad coverage; browser email-link flows are not fully routed into the app. External Google/email verification remains separate. |
| Home and global search | Live overview, attention items, expiry/reminder/follow-up links, search across modules and saved searches | Implemented; mobile search requires submitting the query. Trust/Family destination receives a member ID but the screen does not use it to focus the member. |
| Documents | Native file/gallery/scanner entry, encrypted upload and review, filters/sort, download, notes/expiry, bulk assignment/delete/download and page management | Broad coverage; document/package context and direct detail assignment are reduced. Native system file presentation replaces browser preview. |
| Packages | Catalogue/category/search/pagination, readiness, manual assignment/override, custom CRUD, queued AI job UI, official source links/refresh, share/PDF/ZIP | Partial workflow parity; see F03–F05. |
| Health | Profiles, library-document records, readings/ranges, tracking/trends, medication controls, reminders, timeline, emergency PDF, visit ZIP and insurance | Partial workflow parity; see F07–F10. |
| Wealth | Records and guided forms, readiness, proof capture/attachment, edits, settlement/follow-up and SOS handoff | Partial creation-flow parity; see F11. |
| Family/Trust/Legacy | Members, permissions, invitations/resend/PIN reset, revoke/leave and invitation acceptance/rejection screens | Implemented in source; HTTPS invitation handoff into native app is missing. Legacy reuses Trust on both clients. |
| Settings/account data | Preferences/theme/region/AI controls, usage, current subscription/cancellation, export, deletion and support | Broad coverage; new purchases and device notifications remain unavailable. |
| Package administration | CRUD, CSV text preview/import and template download code | Screen exists but current UI entry is unreachable; editor/import controls are reduced. |

## Confirmed missing or partial functionality

### F01 — New subscription purchase/upgrade: missing

Web has plan selection, Razorpay checkout, payment verification and entitlement refresh. Mobile displays “New subscription purchases are not available in this app yet.” Reading current billing status, refreshing it and cancelling renewal are implemented. The previous local parity record describes purchases as intentionally deferred; this is still a parity gap, not a request to implement a particular payment provider.

Evidence: web `src/components/BillingCheckoutController.tsx`; mobile `src/features/settings/SettingsScreen.tsx:344`. Billing API wrapper methods do not supply a purchase UI.

### F02 — Native device notifications: missing

Web has browser permission/subscription controls and a Web Push service worker integration. Mobile marks notifications unavailable. APNs/FCM registration, native token storage/delivery, foreground/background receipt and notification-tap routing are not implemented in this app/backend contract. Reminders are visible within Home and Health.

Evidence: web `src/pages/settings/NotificationSettingsRow.tsx` and `src/lib/notification-api.ts`; mobile `src/features/settings/SettingsScreen.tsx:246`; backend `src/services/pushNotifications.service.ts` uses Web Push.

### F03 — Package “Not needed” / undo action: missing

Web can move a checklist requirement into “Not needed” and restore it with “Need it after all.” Mobile shows Owned/Missing and assignment controls, but has no equivalent skip/unskip action. The web skip state is local to the detail view; this audit does not claim it is server-persisted.

Evidence: web `src/pages/packages/pack-detail.tsx:54` and `pack-detail-panels.tsx`; mobile `src/features/readiness/ReadinessScreen.tsx`, requirement rendering after the custom-package controls.

### F04 — Package-context upload and matched-document preview: missing

Web can upload directly against a missing requirement, automatically continue its assignment flow, and preview the matched document from the requirement. Mobile can choose an existing library document and displays its filename, but offers neither upload nor document-open action at the requirement. Users must leave for Documents and return.

Evidence: web `src/pages/packages/pack-detail.tsx:182`, `pack-detail-panels.tsx`, `package-document-preview.tsx`; mobile `src/features/readiness/ReadinessScreen.tsx`, “Choose document” and matched-document text.

### F05 — Excluding matched documents from a package ZIP: missing

Web lets users uncheck matched documents from “In this download.” Mobile includes every matched document, disables its toggle, and only lets users toggle additional library documents. ZIP downloading itself is implemented.

Evidence: web `src/pages/packages/pack-download-card.tsx`; mobile `src/features/readiness/ReadinessScreen.tsx:537` and ZIP ID collection below it.

### F06 — Document context: partial

Web document details show “Used in packages” with links and a direct “Belongs to” selector. Mobile details omit package usage and direct person reassignment. Assignment is still possible by selecting a document in the list and using the bulk assignment control, so assignment itself is not absent.

Evidence: web `src/pages/documents/document-context-panel.tsx`, `document-context-packages.tsx`, `use-document-context.ts`; mobile `src/features/documents/DocumentsScreen.tsx:434` and detail content beginning around line 514.

### F07 — Direct Health report upload: missing

Web’s Health add-record flow accepts a new PDF/image, uploads it into Documents, then processes the Health record. Mobile’s “A record” action only selects an existing library document and is disabled when the library is empty. Uploading into Documents first is a workaround, not the same workflow.

Evidence: web `src/pages/health/records/AddRecordDialog.tsx` and `hooks/useHealthRecordActions.ts`; mobile `src/features/health/HealthScreen.tsx:249` and action configuration near line 295.

### F08 — Health patient/profile resolution: missing guided flow

Web handles ambiguous/unmatched patient identity with a profile chooser or profile creation followed by retry. Mobile detects `awaiting_profile_match` and throws an explanatory error; it does not retain and present the resolution result or offer the web confirmation/create-profile sequence. Selecting a profile before upload covers the ordinary path only.

Evidence: web `src/pages/health/members/MemberResolutionDialog.tsx` and `hooks/useHealthRecordActions.ts`; mobile `src/features/health/HealthScreen.tsx:275`.

### F09 — Health report review actions: partial

Web provides a post-processing measurement-selection dialog, searchable report measurements, tracking controls within the report, and “View original document.” Mobile renders report details through the generic `Details` component without these report-specific controls. Metric tracking exists separately in Trends; original files can be accessed separately through Documents.

Evidence: web `src/pages/health/records/MeasurementSelectionDialog.tsx` and `RecordDetail.tsx`; mobile `src/features/health/HealthScreen.tsx:523`, `src/features/shared/FeatureUI.tsx`.

### F10 — Health trend inspection and test chooser: partial

Web has searchable available metrics, a multi-select tracked-test chooser, full displayed history with dated values/source labels, and charts that position readings by time and draw the report’s reference limits/range. Mobile’s “Choose tests” navigates to Trends, where metrics are individually trackable; there is no equivalent search/multi-select chooser or dated history list. Its chart draws the latest 12 points, evenly spaced, with no plotted reference band and no chart for a single reading. Mobile does show the latest printed range and status on the overview card.

Evidence: web `src/pages/health/overview/Trends.tsx`, `TrackedTestChooser.tsx`, `src/pages/health/MeasurementChart.tsx`; mobile `src/features/health/HealthScreen.tsx:408`, `:534`, `MeasurementTrend.tsx`.

### F11 — Wealth creation from existing vault documents and richer loan entry: partial

Web’s “From a document” flow selects an existing relevant vault document or uploads one, then opens a holding form with document-derived defaults. Mobile’s similarly named action opens new-file proof capture and creates a `PAYMENT_PROOF`; it does not offer the same existing-document-to-holding sequence. Existing documents can be attached to a record after it is created.

Web money-lent/borrowed creation includes separate “What for” and “Who,” follow-up note and proof selection/upload during entry. Mobile’s simple creation form combines person/title and omits those dedicated fields and proof-at-creation controls. Later record edits and proof attachment cover part of this functionality.

Evidence: web `src/pages/wealth/capture-proof-dialog.tsx` (`ProofModal`, `MoneyLentBorrowedModal`); mobile `src/features/wealth/WealthScreen.tsx:143`, `:207`, `ProofCaptureDialog.tsx`, `proofCapture.ts`.

### F12 — HTTPS links and token-based reset inside native apps: missing

Web handles invitation URLs, password-reset token URLs and module record URLs. Mobile linking only declares `readiness://` and maps document-library/invitation paths. Neither platform has the verified HTTPS app/universal-link configuration needed to claim that normal web/email links open the equivalent native destination. Mobile has an OTP password-reset screen, but no reset-token route/screen and no external link mappings for package/Health/Wealth detail destinations. Internal global-search navigation is a separate implemented feature.

Evidence: web `src/App.tsx`, `src/pages/reset-password/index.tsx`; mobile `src/app/navigation/RootNavigator.tsx:30`, `src/features/auth/screens/ForgotPasswordScreen.tsx`; iOS `Info.plist`/project configuration; Android `AndroidManifest.xml`.

iOS does have URL-scheme forwarding through `RCTLinkingManager` in `AppDelegate.swift`; that is not missing.

### F13 — Reachable package-administration entry: missing in current navigation

The native PackageAdmin screen is registered. Its only navigation button is on ProfileScreen. Current header avatar navigation opens Settings, and no current UI action navigates to Profile. Settings has Family and Trust entries, but no admin entry. Therefore admin CRUD code exists without a normal reachable entry in the current source navigation.

Evidence: `src/components/navigation/AppHeader.tsx:76`, `src/features/profile/ProfileScreen.tsx:134`, `src/app/navigation/RootNavigator.tsx`; search of navigation callers under mobile `src`.

### F14 — Package-administration editing and CSV file import: partial

Web exposes category filtering and editable country/applicability/subtitle and primary source metadata. Mobile’s form exposes a smaller field set and preserves some metadata without making it editable. Requirements and sources use JSON text rather than web’s structured editing controls. Web picks a CSV file; mobile requires pasting CSV contents. Template download and CSV preview/import API calls exist.

Evidence: web `src/pages/admin/packages/index.tsx`, editor around lines 299–350 and CSV input near line 360; mobile `src/features/admin/PackageAdminScreen.tsx:42`, `:121`, `:223`.

## Implemented but blocked or not fully verified

These should not be counted as wholly missing mobile modules:

- **Gmail/Google Drive:** both client implementations exist, but the current backend mounts are commented out in `backend/src/app.ts:173` and `:175`. This is a shared backend availability gap. Mobile UI can select these providers inside the import dialog even though its entry button is named DigiLocker.
- **DigiLocker:** consent, session status, document selection/import and cancellation paths exist. Live provider authorization/import remains unverified in retained QA evidence.
- **Google sign-in, email OTP/invitations, live AI package generation, SOS email delivery:** client code exists; live service/device behavior was not exercised in this audit and is not established by wrapper presence.
- **Physical camera/gallery uploads:** native iOS VisionKit/Photos and Android ML Kit/gallery implementations exist. Retained QA records picker opening and native builds, but not complete physical-camera end-to-end evidence.
- **Android interaction coverage:** retained QA describes native workflow checks and launch verification, but explicitly leaves broader Android interactive checks deferred. iOS has more interactive evidence. Neither is newly runtime-certified here.
- **Deployment:** the retained QA record describes local backend fixes needed by clients, including metadata routes and System appearance. No deployment was checked during this audit.

Source: `docs/qa/verification.md` and `docs/WEB_MOBILE_PARITY.md`, reviewed as previous evidence, not fresh test results.

## Web-specific surfaces

The public marketing landing page, early-access waitlist/unsubscribe and browser-domain restrictions have no native equivalent. These are web-specific product surfaces and are excluded from the core signed-in feature-gap count. Native onboarding exists. Browser drag/drop, clipboard paste and service-worker installation need platform-appropriate alternatives rather than literal ports.

## Suggested order

1. Finish Health ingestion/review/resolution (F07–F09) and restore a reachable admin entry (F13).
2. Close the package checklist/download gaps (F03–F05), then Wealth creation parity (F11).
3. Add document context, richer Health inspection and admin controls (F06, F10, F14).
4. Implement native notification delivery and HTTPS link handling (F02, F12); handle purchases (F01) when the prior deferral is lifted.
5. Verify configured provider flows and full Android/iOS device workflows before claiming release parity.
