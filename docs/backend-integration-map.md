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
