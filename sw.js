// Baby Playroom Service Worker
// Implements PWA caching for offline functionality

const CACHE_NAME = 'baby-playroom-v1';
const AUDIO_CACHE_NAME = 'baby-playroom-audio-v1';

// Core assets to pre-cache
const CORE_ASSETS = [
  './',
  './index.html', 
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap'
];

// BBC Sound Effects URLs that will be cached on demand
const SOUND_URLS = [
  'https://bbcsfx.acropolis.org.uk/assets/01011751.wav', // Cat purr
  'https://bbcsfx.acropolis.org.uk/assets/01011754.wav', // Cat meow
  'https://bbcsfx.acropolis.org.uk/assets/01003046.wav', // Dog calm
  'https://bbcsfx.acropolis.org.uk/assets/01003039.wav', // Dog excited
  'https://bbcsfx.acropolis.org.uk/assets/01019012.wav', // Sheep calm
  'https://bbcsfx.acropolis.org.uk/assets/01019008.wav', // Sheep excited
  'https://bbcsfx.acropolis.org.uk/assets/01009165.wav', // Cow calm
  'https://bbcsfx.acropolis.org.uk/assets/01009159.wav', // Cow excited
  'https://bbcsfx.acropolis.org.uk/assets/01021022.wav', // Bird calm
  'https://bbcsfx.acropolis.org.uk/assets/01021031.wav', // Bird excited
  'https://bbcsfx.acropolis.org.uk/assets/01021038.wav', // Chick calm
  'https://bbcsfx.acropolis.org.uk/assets/01021040.wav', // Chick excited
  'https://bbcsfx.acropolis.org.uk/assets/01014014.wav', // Duck calm
  'https://bbcsfx.acropolis.org.uk/assets/01014018.wav', // Duck excited
  'https://bbcsfx.acropolis.org.uk/assets/01015001.wav', // Frog calm
  'https://bbcsfx.acropolis.org.uk/assets/01015004.wav', // Frog excited
  'https://bbcsfx.acropolis.org.uk/assets/01022005.wav', // Rabbit calm
  'https://bbcsfx.acropolis.org.uk/assets/01022009.wav', // Rabbit excited
  'https://bbcsfx.acropolis.org.uk/assets/01017012.wav', // Penguin calm
  'https://bbcsfx.acropolis.org.uk/assets/01017016.wav'  // Penguin excited
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('Core assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache core assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (isAudioRequest(request)) {
    event.respondWith(handleAudioRequest(request));
  } else if (isCoreAsset(request)) {
    event.respondWith(handleCoreAssetRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for audio
function isAudioRequest(request) {
  return request.url.includes('bbcsfx.acropolis.org.uk') || 
         request.url.endsWith('.wav') || 
         request.url.endsWith('.mp3');
}

// Check if request is for core asset
function isCoreAsset(request) {
  const url = new URL(request.url);
  return CORE_ASSETS.some(asset => {
    if (asset.startsWith('http')) {
      return request.url === asset;
    } else {
      return url.pathname === asset || url.pathname === asset.replace('./', '/');
    }
  });
}

// Handle audio requests - cache on first use
async function handleAudioRequest(request) {
  try {
    // Try cache first
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const cachedResponse = await audioCache.match(request);
    
    if (cachedResponse) {
      console.log('Serving audio from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    console.log('Fetching audio from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the audio file for future use
      const responseClone = networkResponse.clone();
      await audioCache.put(request, responseClone);
      console.log('Audio cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error handling audio request:', error);
    
    // Try to return cached version as fallback
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const cachedResponse = await audioCache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version, return error response
    return new Response('Audio unavailable offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Handle core asset requests - cache first strategy
async function handleCoreAssetRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving core asset from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error handling core asset request:', error);
    
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept').includes('text/html')) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Baby Playroom - Offline</title>
          <style>
            body { 
              font-family: sans-serif; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #FFE5E5 0%, #E5F3FF 50%, #F0FFE5 100%);
            }
          </style>
        </head>
        <body>
          <h1>Baby Playroom</h1>
          <p>You're currently offline. Please check your internet connection and try again.</p>
          <button onclick="location.reload()">Try Again</button>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Handle other requests - network first
async function handleOtherRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);
    
    // For font requests, try to return a cached version
    if (request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com')) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    return new Response('Resource unavailable offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Message handling for manual cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    // Pre-cache specific audio files
    const audioUrl = event.data.url;
    if (SOUND_URLS.includes(audioUrl)) {
      caches.open(AUDIO_CACHE_NAME)
        .then(cache => cache.add(audioUrl))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
    }
  }
});
