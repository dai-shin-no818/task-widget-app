/*
 * サービスワーカー（GitHub Pages に sw.js として置く）
 * ページとフォントを iPad の中に保存しておき、次回はネットを待たずに保存したものを出す。
 * 裏で新しい版を取りに行って保存し直すので、ページを更新したときは「次に開いたとき」から新しい版になる。
 * タスクのデータ（api.github.com）と書き込み（script.google.com）は保存しない。
 */
const CACHE = 'tw-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' && url.origin === self.location.origin;
  const isFont = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!isPage && !isFont) return;

  const key = isPage ? './' : e.request;   // ?w=1 も ?w=2 も同じページなので、まとめて1つ保存する
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(key);
    const fresh = fetch(e.request)
      .then(res => {
        if (res.ok || res.type === 'opaque') cache.put(key, res.clone());
        return res;
      })
      .catch(() => hit);
    if (hit) {
      e.waitUntil(fresh);   // 保存したものをすぐ出して、裏で新しい版を保存
      return hit;
    }
    return fresh;
  }));
});
