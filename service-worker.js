const CACHE_NAME = 'kmap-v1';
const ASSETS = [
  './KMAP.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&display=swap'
];

// インストール：アセットをキャッシュ
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.filter(function(url) {
        return !url.startsWith('https://fonts.googleapis.com');
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// フェッチ：キャッシュ優先、なければネットワーク
self.addEventListener('fetch', function(e) {
  // Googleアカウント・Drive APIはキャッシュしない
  if (e.request.url.includes('accounts.google.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('apis.google.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        // 成功したレスポンスはキャッシュに追加
        if (res && res.status === 200 && res.type === 'basic') {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, resClone);
          });
        }
        return res;
      }).catch(function() {
        // オフライン時はKMAP.htmlを返す
        return caches.match('./KMAP.html');
      });
    })
  );
});
