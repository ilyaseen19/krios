// Service Worker Update Service
// This service helps manage service worker updates and notifications

// Check if service worker is supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('ServiceWorker registration successful:', registration);
    return registration;
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
    return null;
  }
};

// Check for service worker updates
export const checkForUpdates = async (registration: ServiceWorkerRegistration): Promise<boolean> => {
  try {
    await registration.update();
    return true;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return false;
  }
};

// Force the waiting service worker to become active
export const activateUpdate = (registration: ServiceWorkerRegistration): void => {
  if (registration.waiting) {
    // Send message to service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

// Setup update detection
export const setupUpdateDetection = (onUpdateFound?: () => void): void => {
  if (!isServiceWorkerSupported()) return;
  
  // Detect controller change and reload the page
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('New service worker activated, reloading page for fresh content');
      window.location.reload();
    }
  });
  
  // Listen for new service workers
  navigator.serviceWorker.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New service worker available');
          if (onUpdateFound) {
            onUpdateFound();
          }
        }
      });
    });
    
    // Initial update check
    checkForUpdates(registration);
    
    // Periodic update checks (every minute in dev mode)
    if (import.meta.env.DEV) {
      setInterval(() => {
        checkForUpdates(registration);
      }, 60000);
    }
  });
};

// Initialize the service worker update system
export const initServiceWorkerUpdates = (onUpdateFound?: () => void): void => {
  if (!isServiceWorkerSupported()) return;
  
  window.addEventListener('load', async () => {
    const registration = await registerServiceWorker();
    if (registration) {
      setupUpdateDetection(onUpdateFound);
    }
  });
};