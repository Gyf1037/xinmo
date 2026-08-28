// ============================================================
//  心魔试炼 · Service Worker（离线缓存）
//  更新游戏后：重新部署全部文件，打开页面两次即可完成替换
// ============================================================
const CACHE_NAME = 'xinmo-shilian-v1';
const PRECACHE = [
  './心魔试炼.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// 安装：预缓存核心文件，并跳过等待
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧版本缓存，接管所有同源页面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 页面导航：网络优先，离线时回退缓存，保证更新能及时生效
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('./心魔试炼.html'))
        )
    );
    return;
  }

  // 静态资源（图片、字体、图标等）：缓存优先，后台静默更新
  event.respondWith(
    caches.match(req).then((hit) => {
      const upd = fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || upd;
    })
  );
});
