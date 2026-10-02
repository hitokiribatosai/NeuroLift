try {
 const owner = localStorage.getItem('neuroLift_active_owner') || 'guest';
 const data = JSON.parse(localStorage.getItem('neuroLift_workspace_' + owner) || '{}').data || {};
 const native = window.Capacitor?.isNativePlatform?.() || window.androidBridge || window.webkit?.messageHandlers?.bridge;
 const light = native
   ? (data.neuroLift_theme || localStorage.getItem('neuroLift_theme')) === 'light'
   : data.neuroLift_web_theme !== 'dark';
 document.documentElement.classList.toggle('dark', !light);
 document.documentElement.style.colorScheme = light ? 'light' : 'dark';
 document.documentElement.style.backgroundColor = light ? '#ffffff' : '#0a0a0a';
} catch { /* Theme provider supplies defaults. */ }
