export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });

    // Handle service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker updated');
      // Optionally show a notification that a new version is available
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return null;

  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return null;
}

export async function checkNotificationPermission() {
  if (typeof window === 'undefined') return 'default';

  if ('Notification' in window) {
    return Notification.permission;
  }

  return 'default';
}
