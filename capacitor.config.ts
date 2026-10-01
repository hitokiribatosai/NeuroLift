import type { CapacitorConfig } from '@capacitor/cli';
const debug = process.env.NEUROLIFT_NATIVE_DEBUG === 'true';
const config: CapacitorConfig = {
 appId: 'com.neurolift.app', appName: 'NeuroLift', webDir: 'dist',
 server: { cleartext: debug },
 android: { allowMixedContent: debug, webContentsDebuggingEnabled: debug, backgroundColor: '#0a0a0a' },
 ios: { contentInset: 'always', webContentsDebuggingEnabled: debug, handleApplicationNotifications: true },
 plugins: {
  StatusBar: { overlaysWebView: true, style: 'Dark', backgroundColor: '#0a0a0a' },
  LocalNotifications: { smallIcon: 'ic_stat_neurolift', iconColor: '#14b8a6' },
 },
};
export default config;
