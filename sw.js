/* Tools Media Downloader service worker: follow notifications */
var SLOTS=[9,14,20];
var MSG=[
{t:"Shrink a GIF in seconds",b:"Compress animated GIFs right in your browser.",u:"gif-compressor.html"},
{t:"Merge or split PDFs",b:"Free PDF tools, no signup needed.",u:"pdf-tools.html"},
{t:"Make a QR code",b:"Create QR codes for links, WiFi and text.",u:"qr-generator.html"},
{t:"Resize for any platform",b:"Instagram, YouTube and more, sized right.",u:"image-resizer.html"},
{t:"Convert any image",b:"PNG, JPG, WebP and BMP in one click.",u:"image-converter.html"},
{t:"Turn a video into a GIF",b:"Convert MP4 and WebM to animated GIFs.",u:"video-to-gif.html"}];
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
function slot(){var h=new Date().getHours(),i=-1;for(var k=0;k<SLOTS.length;k++)if(h>=SLOTS[k])i=k;return i}
self.addEventListener("periodicsync",function(e){
if(e.tag!=="tmd-tips")return;var i=slot();if(i<0)return;
var n=new Date(),tag="tmd-"+n.getFullYear()+"-"+(n.getMonth()+1)+"-"+n.getDate()+"-"+i,m=MSG[(Math.floor(Date.now()/864e5)*3+i)%MSG.length];
e.waitUntil(self.registration.getNotifications({tag:tag}).then(function(a){if(a.length)return;return self.registration.showNotification(m.t,{body:m.b,tag:tag,data:{url:m.u}})}))});
/* ready for a real push server (OneSignal / Firebase / web-push) */
self.addEventListener("push",function(e){var d={};try{d=e.data.json()}catch(x){}
e.waitUntil(self.registration.showNotification(d.title||"Tools Media Downloader",{body:d.body||"",data:{url:d.url||"index.html"}}))});
self.addEventListener("notificationclick",function(e){e.notification.close();
var u=new URL((e.notification.data&&e.notification.data.url)||"index.html",self.registration.scope).href;
e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if(l[i].url===u&&"focus" in l[i])return l[i].focus()}return self.clients.openWindow(u)}))});
