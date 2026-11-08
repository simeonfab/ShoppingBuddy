# Download and install the free SmartShop test APK

1. Open the repository's **Actions** tab and select **SmartShop Android debug APK**.
2. Open a successful run and download `smartshop-android-debug-build-<build-number>` from **Artifacts**.
3. Unzip the downloaded artifact; the file inside is `app-debug.apk`.
4. Transfer the APK to the Android phone by USB, Drive, email to yourself, or another trusted method.
5. On the phone, open the APK. If Android asks, allow **Install unknown apps** for the app that opened the file. Do not globally weaken device security.
6. Confirm installation. SmartShop runs locally and does not need a browser.
7. For a later build, download the newer artifact and open its APK. Android should offer an update when the application ID and signing identity match; otherwise uninstall the older debug build first (after checking that any needed local-only data is synchronised or backed up).

This stage deliberately uses a debug APK and does not use Google Play, paid signing, paid runners, or a purchased domain. Debug APKs are for direct testing, not production distribution.
