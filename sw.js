const CACHE = 'baby-motivator-v1';
// Adjust CORE assets based on your actual file structure and needs.
// If index.html is at the root and refers to assets in the same root or /assets, this is a starting point.
const CORE = [
  './', // Represents index.html at the root
  // Add other critical assets here if they are not being loaded from CDNs
  // For example, if you had local CSS or JS:
  // './style.css', 
  // './app.js', 
  // Add OpenMoji WOFF2 and Howler.js if you decide to host them locally
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(err => console.error('SW Install Cache AddAll Error:', err)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r; // Serve from cache if found

      // For other requests, try to fetch from network
      return fetch(e.request).then(res => {
        // Cache MP3s on the fly if they are successfully fetched
        if (e.request.url.endsWith('.mp3') && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(err => {
        console.error('SW Fetch Error:', e.request.url, err);
        // Optionally, return a fallback response for failed fetches, e.g., an offline page or image
      });
    })
  );
});
