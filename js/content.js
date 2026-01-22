
import { Store } from "./store.js";

async function fetchJson(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed ${path}`);
  return await res.json();
}

function deepClone(o){ return JSON.parse(JSON.stringify(o)); }

export class ContentHub{
  constructor(store){
    this.store = store;
    this.registry = null;
    this.packages = [];
    this.data = {
      genres: [],
      instruments: [],
      blueprints: [],
      masters: []
    };
  }

  async init(){
    // load registry
    this.registry = await fetchJson("./content/registry.json");

    // package toggles (local overrides)
    const overrides = this.store.getPackageOverrides();
    const pkgs = this.registry.packages.map(p=>{
      const enabled = overrides[p.id]?.enabled ?? p.enabledByDefault ?? true;
      return { ...p, enabled };
    });

    // merge local DLC bundles installed in admin
    const localBundles = this.store.getLocalDlcs();
    for(const b of localBundles){
      pkgs.push({
        id: b.id,
        name: b.name,
        type:"dlc_local",
        version: b.version,
        enabled: overrides[b.id]?.enabled ?? true,
        __local: true
      });
    }

    this.packages = pkgs;

    // load core + enabled packages
    const merged = { genres:[], instruments:[], blueprints:[], masters:[] };

    // core/in-repo packages
    for(const p of pkgs.filter(x=>x.enabled && !x.__local)){
      const man = await fetchJson("./" + p.path);
      for(const entry of man.data){
        const payload = await fetchJson("./" + entry.path);
        if(entry.type==="genres") merged.genres.push(...(payload.genres||[]));
        if(entry.type==="instruments") merged.instruments.push(...(payload.instruments||[]));
        if(entry.type==="blueprints") merged.blueprints.push(...(payload.blueprints||[]));
        if(entry.type==="masters") merged.masters.push(...(payload.modes||[]));
      }
    }

    // local bundles
    for(const b of localBundles){
      if(!(overrides[b.id]?.enabled ?? true)) continue;
      // bundle file map
      const files = b.files || {};
      if(files["data/genres.json"]?.genres) merged.genres.push(...files["data/genres.json"].genres);
      if(files["data/instruments.json"]?.instruments) merged.instruments.push(...files["data/instruments.json"].instruments);
      if(files["data/blueprints.json"]?.blueprints) merged.blueprints.push(...files["data/blueprints.json"].blueprints);
      if(files["data/masters.json"]?.modes) merged.masters.push(...files["data/masters.json"].modes);
    }

    // de-dupe by id
    const uniq = (arr)=> Object.values(arr.reduce((acc,x)=> (acc[x.id]=x, acc), {}));
    this.data.genres = uniq(merged.genres);
    this.data.instruments = uniq(merged.instruments);
    this.data.blueprints = uniq(merged.blueprints);
    this.data.masters = uniq(merged.masters);

    // sort for UX
    this.data.genres.sort((a,b)=> a.name.localeCompare(b.name));
    this.data.instruments.sort((a,b)=> a.name.localeCompare(b.name));
  }

  getPackages(){ return deepClone(this.packages); }
  getGenres(){ return deepClone(this.data.genres); }
  getInstruments(){ return deepClone(this.data.instruments); }
  getBlueprints(){ return deepClone(this.data.blueprints); }
  getMasterModes(){ return deepClone(this.data.masters); }

  findBlueprint(genreId, instrumentId){
    return this.data.blueprints.find(b=> b.genreId===genreId && b.instrumentId===instrumentId) || null;
  }

  fallbackBlueprint(instrumentId){
    // pick any blueprint with instrument, else first blueprint
    return this.data.blueprints.find(b=> b.instrumentId===instrumentId) || this.data.blueprints[0] || null;
  }
}
