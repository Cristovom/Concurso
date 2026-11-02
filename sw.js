// Revisa TI v1.3.0: update in place, precache core, optional offline PDF caching.
const CACHE='revisati-core-v1.3.0';
const CORE=['./','./index.html','./provas.html','./provas-data.json','./simulados.html','./semanais.html','./resgate.html','./packs/catalogo.json','./packs/semana-01.json','./version.json','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('revisati-core-')&&k!==CACHE)||(k.startsWith('revisati-iprejun-'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  if(request.headers.has('range')){
   // Chrome/mobile PDF readers may request byte ranges. Serve cached PDFs offline as 206.
   if(url.pathname.toLowerCase().endsWith('.pdf')){
    const stored=await caches.match(new Request(url.href));
    if(stored){
     const m=/^bytes=(\d+)-(\d*)$/i.exec(request.headers.get('range')||'');
     if(m){
      const data=await stored.arrayBuffer(),len=data.byteLength,start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),len-1):len-1;
      if(start<len&&start<=end)return new Response(data.slice(start,end+1),{status:206,headers:{'Content-Type':'application/pdf','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${len}`,'Content-Length':String(end-start+1)}});
     }
    }
   }
   return fetch(request);
  }
  try{
   const response=await fetch(request);
   if(response.ok&&response.status===200){const copy=response.clone(),c=await caches.open(CACHE);c.put(request,copy).catch(()=>{})}
   return response;
  }catch(e){
   const cached=await caches.match(request,{ignoreSearch:true});if(cached)return cached;
   if(request.mode==='navigate'){const fallback=await caches.match('./index.html');if(fallback)return fallback}
   throw e;
  }
 })());
});
