# Android APK build with GitHub Actions + Gradle

This workflow builds the Expo/React Native app with Android Gradle on GitHub-hosted runners. It does **not** consume Expo EAS Android build minutes.

## Important: keep the existing app signing identity

To install this APK as an update over the currently distributed EAS APK, the Gradle build must use the **exact same Android keystore, key alias, and passwords** as the existing EAS Android application. Do not create a new keystore for this workflow unless you intentionally want a different app-signing identity; a different signing key prevents in-place updates.

The workflow deliberately stops before building if any signing secret is missing.

## One-time setup

1. Open the Expo project credentials for Android and download/export the existing keystore used by the current EAS builds. Do not rotate or replace it.
2. In the repository, open **Settings → Secrets and variables → Actions → New repository secret**.
3. Add these four secrets:
   - `ANDROID_KEYSTORE_BASE64`: Base64-encoded contents of the existing `.jks`/ `.keystore` file (single line).
   - `ANDROID_KEYSTORE_PASSWORD`: keystore password.
   - `ANDROID_KEY_ALIAS`: exact alias from Expo credentials.
   - `ANDROID_KEY_PASSWORD`: private-key password.
4. Keep the keystore file and passwords private. Never commit them to Git or paste them into chat.

Example to produce the Base64 value locally:

```bash
base64 -w 0 existing-upload-keystore.jks
```

On macOS:

```bash
base64 < existing-upload-keystore.jks | tr -d '\\n'
```

## Run the build

Open **Actions → Build Android APK (Gradle) → Run workflow** and select `feature/common-admin-portal`.

The workflow runs TypeScript validation, generates the native Android project from the Expo config, configures release signing from GitHub Secrets, runs `./gradlew :app:assembleRelease`, verifies the APK signature, and publishes:

`BANGLAR-TOURNAMENTS-APK-<run-number>.apk`

as a GitHub prerelease asset.

## Notes

- The workflow is manual-only and restricted to `feature/common-admin-portal`; it does not replace or modify the existing EAS workflow.
- The workflow does not automatically build an APK until manually dispatched.
- A successful build still needs a real-device update/install test. Verify the package ID and signing certificate against the currently installed APK before distributing it.
