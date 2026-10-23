const CACHE_NAME = 'ai-jaryo-v3';
const SHARE_CACHE = 'ai-jaryo-share-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const cache = await caches.open(SHARE_CACHE);
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const sharedUrl = formData.get('url') || '';
        const files = formData.getAll('images') || [];
        const fileMeta = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f && f.size > 0) {
            const key = '/shared-img-' + i;
            await cache.put(key, new Response(f, { headers: { 'Content-Type': f.type || 'image/jpeg' } }));
            fileMeta.push({ key, type: f.type || 'image/jpeg', name: f.name || ('capture_' + i + '.jpg') });
          }
        }
        await cache.put('/shared-meta', new Response(JSON.stringify({
          title: String(title),
          text: String(text),
          url: String(sharedUrl),
          files: fileMeta,
          ts: Date.now()
        }), { headers: { 'Content-Type': 'application/json' } }));
        return Response.redirect('/ai-jaryo/?shared=1', 303);
      } catch (err) {
        return Response.redirect('/ai-jaryo/?add=1', 303);
      }
    })());
    return;
  }
});
