// service-worker.js – Caches all files from public folder using GitHub API
const CACHE_NAME = 'packarcade-v1';
const GITHUB_REPO = 'sussybocca/PackArcade';
const PUBLIC_PATH = 'public'; // folder inside the repo
const BRANCH = 'main'; // or your default branch

// Base URLs
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents/${PUBLIC_PATH}?ref=${BRANCH}`;
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${PUBLIC_PATH}`;

// Essential files that must be cached (outside public or for the root)
const essentialFiles = [
  '/',
  '/index.html',
];

// Install event: fetch all file URLs from GitHub API and cache them
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // First cache essential files
      await cache.addAll(essentialFiles);

      // Now fetch the directory listing recursively
      const allFiles = await getAllFilesFromGitHub(API_BASE);
      
      // Convert to raw URLs and cache
      const fileUrls = allFiles.map(file => {
        // Replace the API path with raw URL
        const relativePath = file.path.replace(`${PUBLIC_PATH}/`, '');
        return `${RAW_BASE}/${encodeURIComponent(relativePath)}`;
      });

      // Add them to cache (chunked to avoid rate limits/timeouts)
      for (let i = 0; i < fileUrls.length; i += 10) {
        const chunk = fileUrls.slice(i, i + 10);
        await cache.addAll(chunk);
        console.log(`Cached chunk ${i} to ${i + chunk.length}`);
      }
      
      console.log(`Cached ${fileUrls.length} files from public folder`);
    })()
  );
});

// Recursively get all files from GitHub API (handles subdirectories)
async function getAllFilesFromGitHub(apiUrl) {
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  const items = await response.json();
  
  let files = [];
  for (const item of items) {
    if (item.type === 'file') {
      files.push(item);
    } else if (item.type === 'dir') {
      const subFiles = await getAllFilesFromGitHub(item.url);
      files = files.concat(subFiles);
    }
  }
  return files;
}

// Fetch event: cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      // If not in cache, fetch from network and optionally cache
      try {
        const networkResponse = await fetch(event.request);
        // Optionally cache new files (if they belong to the public folder)
        if (networkResponse.ok && event.request.url.includes('raw.githubusercontent.com')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // If offline and not in cache, maybe return a fallback
        console.error('Fetch failed; offline and no cache:', error);
        // You could return a custom offline page here
        return new Response('Offline and resource not cached', { status: 503 });
      }
    })()
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
