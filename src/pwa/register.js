export async function registerServiceWorker(){
  if(!("serviceWorker" in navigator)) return;
  try{
    await navigator.serviceWorker.register("./pwa/sw.js", { scope: "./" });
  }catch(err){
    // SW registration failure should never block the app
    console.warn("[SW] registration failed", err);
  }
}
