# 🔤 Text Visibility Fix for Realme/Poco/Xiaomi

## The Problem
You noticed that text and numbers were **dark/invisible** on Realme and Pocophone devices, while looking perfect (white) on Samsung.

## The Cause: "Dark Mode Inversion"
This is **NOT a font problem**. It is a **System Color Management** problem unique to Chinese Android skins (ColorOS, MIUI, HyperOS).

These devices have a feature called **"Dark Mode for Third-Party Apps"**.
1. They see your app has a dark background.
2. They think "I should help make this dark mode!"
3. They aggressively **invert** the text colors.
4. Result: Your **White Text** is inverted to **Black/Dark Gray**, making it invisible against your dark background.

## The Solution Applied
I have added specific CSS instructions to tell these devices: **"STOP touching the colors!"**

### 1. Force Color Adjustment Disable
Added to `index.css`:
```css
:root {
  color-scheme: only dark;      /* Tell browser we are ALREADY dark */
  forced-color-adjust: none;    /* Stop system from overriding colors */
}
```

### 2. Explicit Text Color Overrides
I added rules to force critical text elements to remain white, even if the system tries to invert them:
```css
h1, h2, h3, p, span, div, button {
  forced-color-adjust: none;
}

.text-white {
  color: #ffffff !important; 
}
```

### 3. Print Color Adjust
Added compatibility for print-style color adjustments which some webviews use:
```css
body {
  print-color-adjust: exact;
}
```

## How to Apply Fix
You need to **Rebuild the Android App** to apply these CSS changes.

1. **Build the web assets:**
   ```bash
   npm run build
   ```

2. **Sync to Android:**
   ```bash
   npm run android:sync
   ```

3. **Open Android Studio & Run:**
   ```bash
   npm run android:open
   ```

## Verification
After rebuilding, check the Realme/Poco device again.
- The Timer numbers ("00:00") should now be **White**.
- The Exercise titles ("Machine Inclined Press") should be **White**.
- The contrast should look exactly like the Samsung device.
