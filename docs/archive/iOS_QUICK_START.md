> Historical document. Not current setup or release guidance; see PROJECT_HANDOVER.md and docs/DEVELOPMENT.md.

# NeuroLift iOS - Quick Start Card

## 🚀 Quick Commands (Run in macOS Terminal)

```bash
# 1. Install dependencies
npm install

# 2. Build and sync to iOS
npm run ios:build

# 3. Open in Xcode
npm run ios:open
```

## 📱 In Xcode

1. **Sign the app**: Select project → Signing & Capabilities → Add your Apple ID
2. **Choose device**: Top bar → Select iPhone Simulator or your device
3. **Run**: Click ▶️ button or press `Cmd + R`

## ⚡ That's it!

Your app should now be running on iOS!

---

## 🔧 If Something Goes Wrong

```bash
# Clean and rebuild
npx cap sync ios --clean
npm run ios:build

# Fix pod issues
cd ios/App
pod install --repo-update
cd ../..
```

## 📚 Full Guide

See `iOS_BUILD_GUIDE.md` for detailed instructions and troubleshooting.
