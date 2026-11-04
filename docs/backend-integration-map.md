# Backend integration map

The mobile app uses the same backend contract as the web app. `READINESS_API_URL`
is the only API origin; access tokens are sent as Bearer tokens and refresh tokens
remain in the backend's HttpOnly cookie.

| Mobile operation     | Backend request                         | Body or query                                               | Mobile owner              |
| -------------------- | --------------------------------------- | ----------------------------------------------------------- | ------------------------- |
| Sign up              | `POST /auth/signup`                     | `{ name, email, password }`                                 | `src/api/auth.api.ts`     |
| Log in               | `POST /auth/login`                      | `{ email, password }`                                       | `src/api/auth.api.ts`     |
| Google sign-in       | `POST /auth/google`                     | `{ credential: <Google ID token> }`                         | `src/api/auth.api.ts`     |
| Refresh session      | `POST /auth/refresh`                    | Refresh cookie                                              | `src/api/client.ts`       |
| Current user         | `GET /auth/me`                          | Bearer token                                                | `src/api/auth.api.ts`     |
| Forgot password      | `POST /auth/forgot-password`            | `{ email }`                                                 | `src/api/auth.api.ts`     |
| Log out              | `POST /auth/logout`                     | Refresh cookie plus Bearer token                            | `src/api/auth.api.ts`     |
| Bootstrap            | `GET /api/bootstrap`                    | Bearer token                                                | `src/api/user.api.ts`     |
| Package list/search  | `GET /api/packages`                     | `category`, `search`, `page`, `limit`, and optional filters | `src/api/packages.api.ts` |
| Package details      | `GET /api/packages/:slug`               | Slug path parameter                                         | `src/api/packages.api.ts` |
| AI-assisted fallback | `POST /api/packages/search-or-generate` | `{ packageType, documentLabels }`                           | `src/api/packages.api.ts` |

`src/api/client.ts` centralizes URL construction, JSON parsing, backend error
messages, authorization, one-time refresh/retry, in-flight GET deduplication, and
safe development logging. `src/services/api.ts` owns RTK Query caching and package
pagination. Readiness is calculated locally from bootstrap document metadata and
package requirements in `src/features/readiness/calculatePackReadiness.ts`.


## Feature parity expansion (26 October 2026)

`src/api/mobile.api.ts`, `health.api.ts`, `documents.api.ts` and `preferences.api.ts`
port the current web contracts. Bootstrap loads `/api/bootstrap` and `/documents`
separately because the bootstrap endpoint returns only a count. Native download
operations stream authenticated responses to private cache; uploads send the same
hybrid encryption envelope as web. See [the parity report](WEB_MOBILE_PARITY.md)
and [local verification](qa/verification.md) for coverage and remaining work.

Local QA API (run from the backend repository):
`node --import tsx scripts/qa/serve-mobile-parity.ts`.
The launcher validates the existing localhost development database, disables
outbound email, and listens only on `127.0.0.1`. It does not migrate or reseed data.
