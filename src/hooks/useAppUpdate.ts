import { useState, useEffect } from 'react';
import { initServiceWorkerUpdates, activateUpdate } from '../services/swUpdateService';

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Initialize service worker updates
    initServiceWorkerUpdates(() => {
      setUpdateAvailable(true);
    });

    // Store registration for later use
    navigator.serviceWorker?.ready.then(reg => {
      setRegistration(reg);
    });
  }, []);

  const applyUpdate = () => {
    if (registration) {
      activateUpdate(registration);
    }
  };

  return {
    updateAvailable,
    applyUpdate
  };
};