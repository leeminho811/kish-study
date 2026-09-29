var CACHE_NAME = 'kish-study-v2';
var APP_SHELL = [
  './kish-study.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function putInCache(req, res){
  if (res && res.status === 200) {
    var copy = res.clone();
    caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 페이지(HTML)는 항상 최신 버전 먼저, 오프라인일 때만 저장된 버전
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(res){ return putInCache(e.request, res); })
        .catch(function(){
          return caches.match(e.request, {ignoreSearch:true}).then(function(c){ return c || caches.match('./kish-study.html'); });
        })
    );
    return;
  }

  // 아이콘 등은 저장된 것 먼저 보여주고 뒤에서 갱신
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise = fetch(e.request).then(function(res){ return putInCache(e.request, res); }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
