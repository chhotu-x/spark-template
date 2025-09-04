const CACHE_VERSION = 'v2';
const CACHE_NAME = `upm-embed-${CACHE_VERSION}`;
const RUNTIME_CACHE = `upm-embed-runtime-${CACHE_VERSION}`;
const ANALYTICS_CACHE = 'upm-analytics-queue';

const STATIC_ASSETS = [
  '/embed.js',
  '/embed-styles.css',
  '/immersive-embed.js'
];

// Cache strategies
const CACHE_STRATEGIES = {
  networkFirst: ['/api/', '/embed/'],
  cacheFirst: ['/static/', '.js', '.css', '.woff', '.woff2'],
  staleWhileRevalidate: ['.json', '/metadata/']
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('Failed to cache some assets:', err);
        // Continue installation even if some assets fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('upm-embed-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Claim all clients
      return self.clients.claim();
    })
  );
});

// Optimized fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http protocols
  if (!request.url.startsWith('http')) return;
  
  // Determine cache strategy
  const strategy = getCacheStrategy(request.url);
  
  switch (strategy) {
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

function getCacheStrategy(url) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => url.includes(pattern))) {
      return strategy;
    }
  }
  return 'networkFirst';
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Resource not available offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });
  
  return cached || fetchPromise;
}

// Background sync for offline analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  try {
    const cache = await caches.open(ANALYTICS_CACHE);
    const requests = await cache.keys();
    
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
        return response;
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    console.log(`Analytics sync: ${successful}/${requests.length} successful`);
  } catch (error) {
    console.error('Analytics sync error:', error);
  }
}

// Message handling for advanced features
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      event.waitUntil(
        cacheUrls(data.urls).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
    case 'CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then(status => {
          event.ports[0].postMessage(status);
        })
      );
      break;
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  const results = await Promise.allSettled(
    urls.map(url => cache.add(url))
  );
  return results;
}

async function clearAllCaches() {
  const names = await caches.keys();
  await Promise.all(names.map(name => caches.delete(name)));
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return status;
}

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const age = now - new Date(dateHeader).getTime();
        if (age > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}
