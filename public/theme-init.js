try {
 const owner = localStorage.getItem('neuroLift_active_owner') || 'guest';
 const data = JSON.parse(localStorage.getItem('neuroLift_workspace_' + owner) || '{}').data || {};
 const platform = window.Capacitor?.getPlatform?.() || (window.androidBridge ? 'android' : window.webkit?.messageHandlers?.bridge ? 'ios' : 'web');
 const light = platform === 'ios'
   ? (data.neuroLift_theme || localStorage.getItem('neuroLift_theme')) === 'light'
   : platform === 'android' ? (data.neuroLift_android_theme || data.neuroLift_theme || 'light') !== 'dark' : data.neuroLift_web_theme !== 'dark';
 document.documentElement.classList.toggle('dark', !light);
 document.documentElement.style.colorScheme = light ? 'light' : 'dark';
 document.documentElement.style.backgroundColor = light ? '#ffffff' : '#0a0a0a';
} catch { /* Theme provider supplies defaults. */ }
