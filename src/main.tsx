import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initOfflineSystem } from './services/offlineService';

// Import the service worker update service
import { initServiceWorkerUpdates } from './services/swUpdateService';

// Initialize service worker with update handling
initServiceWorkerUpdates(() => {
  console.log('New version of the app is available!');
  // You could show a notification to the user here if desired
});

// Initialize offline system
initOfflineSystem().catch(error => {
  console.error('Failed to initialize offline system:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
