# Web and mobile feature comparison — 26 October 2026

Compared the current working copies of `frontend-web`, `readiness-mobile`, and the owning backend routes. Existing uncommitted work was preserved. This is a local implementation and verification record; it does not assert deployed parity.

## Implemented mobile coverage

| Web area | Native implementation | Owning mobile files |
| --- | --- | --- |
| Session and account | Existing password, Google, signup OTP and mandatory PIN flows retained; password reset by email OTP, email/password change verification, logout-all, expiry handling and account-isolated requests added | `src/features/auth`, `src/features/settings`, `src/api/client.ts` |
| Home | Live user and document data, overall archive readiness, 60-day expiry alerts, Health reminders and medication alerts, Wealth follow-ups and links into each module | `src/features/home/HomeScreen.tsx` |
| Documents | Search/category/person/source filters, expiry/week/proof quick filters, sorting, bounded list rendering, native files/camera, explicit AI consent, manual review, encrypted upload, private preview/download, notes/expiry, bulk assignment/download/delete, page add/reorder/replace/delete | `src/features/documents`, `src/native/documentFiles.ts` |
| Packages | Catalogue search, categories including My packs, clear search, pagination, readiness and implied document capabilities, official sources/refresh, manual assignment/override, custom checklist creation/edit/delete, queued AI research/review, share, native PDF export and document ZIP downloads | `src/features/readiness` |
| Health | Profiles and medical details, records from the library, manual measurements/reference ranges, tracking and trends, medicines/meal timing/refill dates, reminders, timeline, emergency PDF, insurance details, provider-filtered visit ZIP | `src/features/health` |
| Wealth | Web family-access readiness and proof/access indicators, recorded totals separated by currency, nominee/proof gaps, holdings/insurance/proof and guided forms, money lent/borrowed, full-detail updates, document attachment and direct encrypted proof capture with retry recovery, follow-up settlement, handoff selection and delivery-result reporting | `src/features/wealth` |
| Family / Trust / Legacy | Members and connections, per-module view/download permissions, invitations/resend/PIN reset, revocation/leave, invitation acceptance/rejection; Legacy reuses Trust as on web | `src/features/trust` |
| Global search | Backend search across modules, exact record/package destinations, Health tabs, account-scoped encrypted recent searches | `src/features/search` |
| Settings | Grouped account/security, direct PIN change/reset, email/password verification with resend, server preferences and theme, searchable regional preferences, AI-off confirmation, usage, subscription status/cancellation/refresh, export preparation/status/download, two-stage deletion confirmation, session controls and web support panels | `src/features/settings` |
| Package administration | Admin-only entry matching web, backend authorization, catalogue CRUD, CSV template/preview/import | `src/features/admin` |

## Shared design and performance

The website supplied the original visual reference, including `frontend-web/src/design-system/variables/colors.ts`, `typography.ts`, `radii.ts`, and the active route components. Mobile now uses the same purple action colors, neutral surfaces, light/dark semantic colors, Poppins font files and licensed font distribution. The five primary destinations are Home, Documents, Packages, Health and Wealth, with the unchanged web logo artwork, active module name, search and account controls in the header.

The supplied mobile Home reference now defines the shared native design. Every screen uses the same bookmark brand/avatar header, floating five-destination navigation, neutral surfaces, purple accents, rounded cards, controls and typography. Home uses live module tiles, an attention banner, overdue-first tasks and upload/create quick actions. Health uses profile cards, a shared action panel and pill tabs, plus test selection/New test when logging readings. Packages use readiness rings and provider source links. Wealth shows the same proof/access readiness calculation and record status indicators. Settings groups controls into panels. Shared native modal roots have independent safe-area providers and visible close controls, including nested choices/forms.


- No JSX `style` props or screen-local `StyleSheet` objects. Layouts use styled components with shared spacing, colors, sizes, typography and shadow tokens. ESLint rejects inline styles.
- Shared page/form/choice/detail-sheet components handle safe areas, modal scrolling, validation and errors.
- Health data loads concurrently; list pages limit rendered document/wealth cards; refresh retains current data; read-only detail actions do not refetch mutation lists.
- Private files download directly into app cache, including authenticated refresh/retry and cleanup after session changes. PDFs/ZIPs are not expanded into JS Blob/base64 copies.
- Only GET requests deduplicate. Independent writes retain their distinct payloads. Requests from a previous account cannot populate a new session.
- Native uploads use AES-256-GCM and RSA-OAEP-4096-SHA256, with temporary-source cleanup. Encrypted staging files use `.readines`: iOS infers `application/macbinary` for `.bin`, overriding the multipart MIME header.

## Backend corrections required by both clients

The web client referenced `/documents/assignment-options`, `/documents/bulk-assign` and `/documents/:id/details`, but the owning router did not implement them. Added authenticated, owner-scoped metadata routes with bounded batches, strict validation, encrypted fields, integrity hashes, serializable updates, and tests for cross-account rejection. Assignment changes a label; it does not transfer document ownership or grant sharing access.

## Runtime limitations and unfinished external work

- Gmail and Drive routers are intentionally commented out in the current backend. Their status endpoints return 404 in live local checks. Mobile surfaces this unavailable state; the backend integrations were not silently enabled.
- DigiLocker provider configuration and a live external consent/import session are required for end-to-end verification. The consent, selection, copy-consent, progress and cancellation UI/API paths are implemented.
- New mobile subscription purchases are intentionally deferred at the user's request; no payment-provider selection is pending for this task. Reading/cancelling an existing subscription is implemented.
- Native APNs/FCM registration/delivery is not implemented by the backend's existing Web Push subscription contract. It requires provider setup and a native registration/delivery integration.
- Google sign-in, external email delivery, live AI provider research, actual payment transactions, handoff email delivery and physical-camera capture require their configured external services/devices. Automated checks do not claim those external actions occurred.
- Android uses ML Kit full document scanning with corner selection and perspective correction; iOS uses VisionKit. Live camera verification still requires physical hardware.
- Interactive checks resumed after the user unlocked the Mac. Web reference screens and iOS screen/dialog checks are recorded in `docs/qa/verification.md`. Android launches with the aligned design. Android interactive checks were deferred at the user’s request; they will test both platforms. The latest request resumed iOS-only simulator checks in Xcode Device Hub, with Android stopped. Physical iPhone use was unavailable because Xcode reported it offline/unsupported despite USB detection. External-service and remaining Android interactive checks are not marked complete.

## Validation evidence

See `docs/qa/` for retained emulator reports and the final verification summary. The native runner is opt-in under `qa/nativeChecks.ts`, rejects remote API origins and non-synthetic accounts, and is not part of the normal application entry. Its temporary launcher and fixture credentials are removed from `index.js` after testing.
