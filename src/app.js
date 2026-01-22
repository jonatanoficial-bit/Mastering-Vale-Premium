import { createRouter, navigate, backOrHome } from "./router.js";
import { contentManager } from "./content/manager.js";
import { mountShell, setHeader, renderHome, renderGenre, renderChain, renderFavorites, renderLibrary, renderSettings } from "./ui/render.js";
import { delegate, copyToClipboard } from "./utils/dom.js";
import { storage, downloadJSON } from "./utils/storage.js";
import { chainToText, fileSafeName, levelLabel } from "./utils/format.js";
import { showToast } from "./ui/toast.js";
import { registerServiceWorker } from "./pwa/register.js";
import { icon } from "./ui/icons.js";

const state = {
  favorites: storage.get("favorites", []),
};

function saveFavorites(){
  storage.set("favorites", state.favorites);
}

function toggleFav(key){
  const i = state.favorites.indexOf(key);
  if(i >= 0) state.favorites.splice(i, 1);
  else state.favorites.push(key);
  saveFavorites();
  return i < 0;
}

function setView(shell, page){
  shell.view.innerHTML = `<div class="fadeIn">${page.html}</div>`;
  setHeader(shell, page.header || {});
  for(const hook of (page.hooks || [])){
    try{ hook(shell.view); }catch(e){ console.warn("hook error", e); }
  }
}

async function main(){
  registerServiceWorker();

  const root = document.getElementById("app");
  const shell = mountShell(root);

  // Back button
  shell.backBtn.addEventListener("click", () => backOrHome());

  // Click/keyboard delegation for cards/buttons
  delegate(root, "click", "[data-nav]", (e, el) => {
    e.preventDefault();
    navigate(el.dataset.nav);
  });
  delegate(root, "keydown", "[data-nav]", (e, el) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      navigate(el.dataset.nav);
    }
  });

  // Load content
  setHeader(shell, { title:"MixBlueprint", subtitle:"Carregando conteúdo…", back:false, activeTab:"home" });
  shell.view.innerHTML = `
    <div class="hero">
      <h1>Carregando…</h1>
      <p>Inicializando core e DLCs ativos.</p>
    </div>
  `;

  let store;
  try{
    store = await contentManager.loadAll();
  }catch(err){
    shell.view.innerHTML = `<div class="notice warn"><b>Falha ao carregar conteúdo.</b> ${String(err?.message || err)}</div>`;
    return;
  }

  const router = createRouter();

  router.add("/home", () => setView(shell, renderHome(store, state)));
  router.add("/genre/:id", (params) => setView(shell, renderGenre(store, params.id)));
  router.add("/chain/:genreId/:instrumentId", (params, query) => {
    const level = query.level || storage.get("lastLevel", "beginner");
    storage.set("lastLevel", level);
    setView(shell, renderChain(store, params.genreId, params.instrumentId, level, state));
  });
  router.add("/favorites", () => setView(shell, renderFavorites(store, state)));
  router.add("/library", () => setView(shell, renderLibrary(store, state)));
  router.add("/settings", () => setView(shell, renderSettings(store, state)));

  // Handle segmented level + copy + favorite + export/import
  delegate(root, "click", "[data-level]", (e, el) => {
    const level = el.dataset.level;
    const raw = (location.hash || "#/home").slice(1);
    const [path, qs] = raw.split("?");
    const q = new URLSearchParams(qs || "");
    q.set("level", level);
    navigate(path, Object.fromEntries(q.entries()), true);
  });

  delegate(root, "click", "[data-copy]", async () => {
    const raw = (location.hash || "#/home").slice(1);
    const [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    if(parts[0] !== "chain") return;

    const genreId = parts[1];
    const instrumentId = parts[2];
    const query = new URLSearchParams(qs || "");
    const level = query.get("level") || storage.get("lastLevel", "beginner");

    const genre = store.getGenre(genreId);
    const instrument = store.getInstrument(instrumentId);
    const info = store.getChain(genreId, instrumentId, level);
    if(!info?.chain) return;

    const txt = chainToText({
      genre,
      instrument,
      levelLabel: levelLabel(level),
      chain: info.chain,
      guide: info.guide
    });
    await copyToClipboard(txt);
    showToast({ title:"Copiado", message:"Cadeia copiada para a área de transferência.", kind:"ok" });

    // Convenience download (desktop)
    try{
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileSafeName(genre?.name)}-${fileSafeName(instrument?.name)}-${level}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }catch{}
  });

  delegate(root, "click", "[data-fav]", (e, el) => {
    const key = el.dataset.fav;
    const added = toggleFav(key);
    el.innerHTML = `${icon("heart")} ${added ? "Favorito" : "Favoritar"}`;
    showToast({ title: added ? "Adicionado" : "Removido", message:"Favoritos são salvos localmente.", kind:"ok" });
  });

  delegate(root, "click", "[data-export]", () => {
    downloadJSON(`mixblueprint-backup-${new Date().toISOString().slice(0,10)}.json`, storage.exportAll());
    showToast({ title:"Exportado", message:"Backup baixado (JSON).", kind:"ok" });
  });

  delegate(root, "change", "#importAll", async (e, el) => {
    const file = el.files?.[0];
    if(!file) return;
    try{
      const payload = JSON.parse(await file.text());
      storage.importAll(payload);
      showToast({ title:"Importado", message:"Recarregando app…", kind:"ok", ms:1800 });
      setTimeout(()=> location.reload(), 350);
    }catch(err){
      showToast({ title:"Falha ao importar", message:String(err?.message || err), kind:"warn", ms:3600 });
    }finally{
      el.value = "";
    }
  });

  router.start();
}

main();
