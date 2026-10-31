# Backend integration map

The mobile app uses the same backend origin and authenticated JSON client as the
web app. `src/api/client.ts` attaches the access token, keeps refresh tokens in
the backend's HttpOnly cookie, retries authenticated requests after refresh, and
surfaces backend error codes and request IDs.

## Connected in mobile

| Feature | Mobile API coverage | UI owner |
| --- | --- | --- |
| Authentication | Login, R-pin login, Google login, signup code request/verification, OTP password reset, mandatory R-pin setup, session restore, logout | `src/features/auth` |
| Account | R-pin change/reset, sign out of all devices, usage summary, export job request/status/download, scheduled deletion | `src/features/profile/ProfileScreen.tsx` |
| Preferences | Read/update appearance, home currency, and supported preferences | `src/features/profile/ProfileScreen.tsx` |
| Documents | Authenticated metadata, encrypted PDF/image import with file/gallery/camera pickers, analysis and review/save, PDF/image/text preview, per-page preview, Drive original-file links, single delete, bulk delete | `src/features/documents/DocumentsScreen.tsx` |
| Packages | List/search, details, AI-generated packs, owner-scoped manual custom packs, requirement assignment/clear | `src/features/readiness/ReadinessScreen.tsx` |
| Health | Members, reminders, encrypted record upload (file/gallery/camera) with AI or manual type and profile matching, records, measurements, tracked metrics, timeline, medications | `src/features/health/HealthScreen.tsx` |
| Trust and family | Members, invitations, permissions, revoke/leave, PIN and resend actions | `src/features/trust` |
| Wealth | Records, dynamic forms, and handoff summary/send | `src/features/wealth/WealthScreen.tsx` |
| Global search | `/api/search` grouped results from the Home search button | `src/features/home/GlobalSearchModal.tsx` |
| Gmail, Drive and DigiLocker | Connect, status, scan, review/import, disconnect; DigiLocker session, selection, consented import and progress polling in `src/features/integrations/digilocker` | `src/features/profile/IntegrationsScreen.tsx` |

## Remaining platform work

- Encrypted document import now selects a PDF or image, encrypts it on-device
  with AES-256-GCM and an RSA-OAEP-SHA256-wrapped key, then analyzes and saves
  only the encrypted upload. AI analysis requires per-import consent. Camera
  capture currently imports a single image, not a multi-page scanner. Decrypting
  downloads and page-management APIs are not wired. Previewed file bytes are
  stored temporarily in the app cache and removed when the preview closes or
  changes.
- Web Push subscription endpoints are not wired to mobile. Native push tokens
  are not interchangeable with Web Push subscriptions and need a native push
  provider/integration.