---
description: How to build the NeuroLift Android APK
---

To prepare the project for an Android build, follow these steps:

1. Build the web project
```bash
npm run build
```

2. Sync the assets with the Android platform
```bash
npx cap sync android
```

3. Open Android Studio to generate the APK
```bash
npx cap open android
```

Once Android Studio is open, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
