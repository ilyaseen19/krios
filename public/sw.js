// Enhanced Service Worker with IndexedDB integration
// Use a timestamp-based cache version to ensure updates are detected
const CACHE_VERSION = new Date().getTime();
const CACHE_NAME = `krios-cache-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/App.css',
  // Add more static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting(); // Force activation
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activation completed');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Fetch event - serve from cache, fallback to network, then cache response
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip service worker script itself to prevent caching issues
  if (event.request.url.includes('/sw.js')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For development mode assets, always use network first to get latest changes
  // This helps during development when files are frequently changing
  if (event.request.url.includes('/src/') || 
      event.request.url.includes('hot-update') || 
      event.request.url.includes('hmr')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For API requests, use network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // For static assets, use cache first, then network
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached response but fetch in background to update cache
      // This ensures we always have the latest version cached for next time
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          updateCache(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(error => {
        console.log('[Service Worker] Background fetch failed:', error);
      });
      
      // Don't wait for the background fetch to complete
      return cachedResponse;
    }
    
    // If not in cache, get from network and cache it
    const networkResponse = await fetch(request);
    // Cache the new response
    await updateCache(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    // Could return a fallback page here
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Network-first strategy for API requests with cache validation
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Only cache successful responses
      const cache = await caches.open(CACHE_NAME);
      // Delete old cache for this request
      await cache.delete(request);
      // Cache the new response
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error(`Network response was not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[Service Worker] Network request failed, checking cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still valid
      const cachedData = await cachedResponse.clone().json();
      if (Array.isArray(cachedData) || (typeof cachedData === 'object' && cachedData !== null)) {
        return cachedResponse;
      }
    }
    
    // If no valid cache, return error response
    return new Response('Data is not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Helper function to update the cache
async function updateCache(request, response) {
  if (!response || response.status !== 200) {
    return;
  }
  
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting and activate immediately');
    self.skipWaiting();
  }
  
  // Handle sync request
  if (event.data && event.data.type === 'SYNC_DATA') {
    // The actual sync will be handled by the application code
    // This just acknowledges the request
    event.ports[0].postMessage({ status: 'received' });
  }
  
  // Handle update check request
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[Service Worker] Update check requested');
    // Respond with current cache version
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        status: 'update_checked',
        version: CACHE_VERSION
      });
    }
  }
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-operations') {
    console.log('[Service Worker] Syncing pending operations');
    event.waitUntil(syncPendingOperations());
  }
});

// Function to sync pending operations
async function syncPendingOperations() {
  // This will be triggered by the sync API
  // The actual sync logic is in the application code
  // This just notifies all clients that sync should happen
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_REQUIRED'
    });
  });
}