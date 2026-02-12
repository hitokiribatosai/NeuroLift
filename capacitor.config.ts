import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neurolift.app',
  appName: 'NeuroLift',
  webDir: 'dist',

  // Server configuration for live reload during development
  server: {
    // Uncomment for development on physical device
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true
  },

  plugins: {
    // Status Bar - Dark theme for both platforms
    StatusBar: {
      overlaysWebView: true,
      style: 'Dark',
      backgroundColor: '#0a0a0a'
    },

    // Keyboard - Better input handling on iOS
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    },

    // Haptics - Consistent feedback across platforms
    Haptics: {
      // iOS uses native haptics, no additional config needed
    },

    // Local Notifications - Workout reminders
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#14b8a6',
      sound: 'beep.wav'
    },

    // App - Handle background/foreground states
    App: {
      // No additional config needed
    }
  },

  // iOS-specific configuration
  ios: {
    contentInset: 'always',
    handleApplicationNotifications: true,
    // Scheme for deep linking
    scheme: 'NeuroLift',
    // LimitsNavigationsToAppBoundDomains for security
    limitsNavigationsToAppBoundDomains: false
  },

  // Android-specific configuration
  android: {
    // Allow mixed content for development
    allowMixedContent: true,
    // Capture back button
    captureInput: true,
    // WebView settings - Enable debugging for better compatibility
    webContentsDebuggingEnabled: true,
    // Improve compatibility with different Android manufacturers
    backgroundColor: '#0a0a0a'
  }
};

export default config;
