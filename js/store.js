export class Store{
  constructor(ns){
    this.ns = ns;
    this._m = (k)=> `${this.ns}:${k}`;
  }

  // favorites
  getFavorites(){
    return JSON.parse(localStorage.getItem(this._m("favorites")) || "[]");
  }
  _setFavorites(arr){
    localStorage.setItem(this._m("favorites"), JSON.stringify(arr));
  }
  isFavorite(genreId, instrumentId, level){
    return this.getFavorites().some(f=> f.genreId===genreId && f.instrumentId===instrumentId && f.level===level);
  }
  toggleFavorite(item){
    const arr = this.getFavorites();
    const idx = arr.findIndex(f=> f.genreId===item.genreId && f.instrumentId===item.instrumentId && f.level===item.level);
    if(idx>=0) arr.splice(idx,1);
    else arr.unshift({ ...item, ts: Date.now() });
    this._setFavorites(arr.slice(0,80));
  }
  clearFavorites(){ this._setFavorites([]); }

  // packages enabled overrides
  getPackageOverrides(){
    return JSON.parse(localStorage.getItem(this._m("pkg_overrides")) || "{}");
  }
  setPackageEnabled(id, enabled){
    const o = this.getPackageOverrides();
    o[id] = { ...(o[id]||{}), enabled: !!enabled, ts: Date.now() };
    localStorage.setItem(this._m("pkg_overrides"), JSON.stringify(o));
  }

  // local DLC bundles
  getLocalDlcs(){
    return JSON.parse(localStorage.getItem(this._m("local_dlcs")) || "[]");
  }
  saveLocalDlcs(list){
    localStorage.setItem(this._m("local_dlcs"), JSON.stringify(list));
  }
  installLocalDlc(bundle){
    const list = this.getLocalDlcs();
    const pkg = bundle.package;
    const entry = {
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      files: pkg.files || {},
      installedAt: Date.now()
    };
    const idx = list.findIndex(x=> x.id===entry.id);
    if(idx>=0) list[idx]=entry;
    else list.unshift(entry);
    this.saveLocalDlcs(list.slice(0,30));
  }
  removeLocalDlc(id){
    const list = this.getLocalDlcs().filter(x=> x.id!==id);
    this.saveLocalDlcs(list);
  }

  // admin auth (local-only)
  getAdminHash(){
    return localStorage.getItem(this._m("admin_hash")) || "";
  }
  setAdminHash(hash){
    localStorage.setItem(this._m("admin_hash"), hash);
  }

  // backups
  exportAll(){
    const out = {};
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith(this.ns + ":")){
        out[k] = localStorage.getItem(k);
      }
    }
    return out;
  }
  importAll(obj){
    for(const [k,v] of Object.entries(obj||{})){
      if(typeof k==="string" && k.startsWith(this.ns + ":")){
        localStorage.setItem(k, v);
      }
    }
  }

  // ✅ progress tracking (AGORA NO LUGAR CERTO)
  getProgress(){
    return JSON.parse(localStorage.getItem(this._m("progress")) || "{}");
  }
  setProgress(key, value=true){
    const p = this.getProgress();
    p[key] = { value, ts: Date.now() };
    localStorage.setItem(this._m("progress"), JSON.stringify(p));
  }
  hasProgress(key){
    return !!this.getProgress()[key]?.value;
  }
}
