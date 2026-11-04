# Google Sign-In configuration

Mobile reads public OAuth client IDs from `.env` (Debug) and `.env.production` (Release). These files are ignored by Git. Never put a client secret in the mobile app.

- `GOOGLE_WEB_CLIENT_ID`: Web application OAuth client in the native clients' Google Cloud project. This is the native SDK's server client, and the audience of the ID token submitted to `/auth/google`.
- `GOOGLE_IOS_CLIENT_ID`: iOS OAuth client registered for `org.reactjs.native.example.ReadinessMobile`.
- `GOOGLE_ANDROID_CLIENT_ID`: Android registration reference. Google resolves it from package name `com.readinessmobile` and signing certificate; it is not passed as the SDK webClientId.
- `GOOGLE_IOS_URL_SCHEME`: saved reference; the Xcode build pre-action derives the actual reversed scheme directly from `GOOGLE_IOS_CLIENT_ID`, so rotating the iOS client also updates the callback scheme.

The iOS delegate first lets Google Sign-In handle its URL callback, then forwards other URLs to React Native. Xcode's generated public callback configuration and the native react-native-config target select the same Debug/Release env files. Keep `.env` API appropriate to the test device; pass `ENVFILE=.env.production` for production-connected testing.

The backend retains `GOOGLE_CLIENT_ID` for the existing website and additionally accepts `GOOGLE_MOBILE_CLIENT_ID` for native Google ID tokens. Tokens still pass Google's signature, issuer, expiry and configured-audience verification, and require a verified email. Existing website credentials/secrets and Gmail/Drive integrations are not replaced.

For a different signing key or Play App Signing, register that certificate SHA-1 under an Android OAuth client in the same Google project. Merely changing the Android client ID string in `.env` does not register a new signing certificate.

Simulator testing must use a signed build (Xcode's normal simulator ad-hoc signing is sufficient). Do not use `CODE_SIGNING_ALLOWED=NO` when testing Google credential persistence: the unsigned test build reproduced Google Keychain error -2; the signed build completed login without clearing the Keychain. No extra keychain-sharing groups or fake team identifiers are required for the normal simulator app.
