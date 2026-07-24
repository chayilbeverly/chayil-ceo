/* ============================================
   Chayil CEO OS — Service Worker
   缓存策略：Network First（优先网络，离线回退缓存）
   ============================================ */

const CACHE_NAME = 'chayil-ceo-v5';
const STATIC_ASSETS = [
  '/chayil-ceo/',
  '/chayil-ceo/index.html',
  '/chayil-ceo/css/styles.css',
  '/chayil-ceo/js/sync.js',
  '/chayil-ceo/js/store.js',
  '/chayil-ceo/js/ui.js',
  '/chayil-ceo/js/app.js',
  '/chayil-ceo/js/modules/home.js',
  '/chayil-ceo/js/modules/daily-plan.js',
  '/chayil-ceo/js/modules/inspiration.js',
  '/chayil-ceo/js/modules/radar.js',
  '/chayil-ceo/js/modules/review.js',
  '/chayil-ceo/js/modules/finance.js',
  '/chayil-ceo/js/modules/english.js',
  '/chayil-ceo/js/modules/assets.js',
  '/chayil-ceo/manifest.json',
  '/chayil-ceo/icons/icon-192.png',
  '/chayil-ceo/icons/icon-512.png',
];

// 安装：预缓存静态资源
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('[SW] 缓存静态资源...');
      return cache.addAll(STATIC_ASSETS).catch(function (err) {
        console.warn('[SW] 部分资源缓存失败（可忽略）:', err);
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// 请求拦截：Network First 策略
self.addEventListener('fetch', function (event) {
  // 跳过非 GET 请求和外部资源
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);

  // 跳过 GitHub API 请求（由 sync.js 自行处理）
  if (url.hostname === 'api.github.com') return;
  // 跳过 Google Fonts / CDN
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return;

  // 对本站资源强制走网络，避免浏览器/缓存旧版本配置
  var isLocalAsset = url.pathname.indexOf('/chayil-ceo/') === 0;
  var fetchOptions = isLocalAsset ? { cache: 'no-cache' } : {};

  // Network First：先尝试网络，失败则用缓存
  event.respondWith(
    fetch(event.request, fetchOptions).then(function (response) {
      // 网络成功 → 更新缓存
      if (response.ok) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, cloned);
        });
      }
      return response;
    }).catch(function () {
      // 网络失败 → 使用缓存
      return caches.match(event.request).then(function (cached) {
        return cached || new Response('离线模式 — 请连接网络后重试', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
