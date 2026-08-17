const CACHE_NAME='sakhi-shell-v3';
const APP_FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
    }
    return response;
  }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));
});

self.addEventListener('message',event=>{
  const data=event.data||{};
  if(data.type!=='notify')return;
  self.registration.showNotification(data.title||'Sakhi reminder',{
    body:data.body||'',tag:data.tag||undefined,renotify:!!data.tag,
    icon:'./icon-192.png',badge:'./icon-192.png',requireInteraction:false
  });
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('navigate'in client)return client.navigate('./index.html').then(()=>client.focus());}
    return self.clients.openWindow?self.clients.openWindow('./index.html'):undefined;
  }));
});
