import { storage } from "../utils/storage.js";

function deepClone(obj){
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

function deepMerge(target, patch){
  if(!patch || typeof patch !== "object") return target;
  for(const [k,v] of Object.entries(patch)){
    if(v && typeof v === "object" && !Array.isArray(v)){
      if(!target[k] || typeof target[k] !== "object" || Array.isArray(target[k])) target[k] = {};
      deepMerge(target[k], v);
    }else{
      target[k] = v;
    }
  }
  return target;
}

export class ContentStore{
  constructor(){
    this.schemaVersion = "1.0";
    this.packages = []; // loaded packages
    this.genres = new Map();
    this.instruments = new Map();
    this.baseChains = {}; // instrumentId -> level -> chain
    this.genreGuides = {}; // genreId -> guide
    this.chainMods = []; // array of patch ops
  }

  applyPackage(pkg){
    const meta = {
      id: pkg?.manifest?.id || pkg.id,
      name: pkg?.manifest?.name || pkg.name || pkg.id,
      version: pkg?.manifest?.version || pkg.version || "0.0.0",
      type: pkg?.manifest?.type || "dlc",
      source: pkg.source || "builtin",
      enabled: pkg.enabled !== false,
    };
    this.packages.push(meta);

    // Genres
    const genres = pkg?.data?.genres;
    if(Array.isArray(genres)){
      for(const g of genres){
        const prev = this.genres.get(g.id) || {};
        this.genres.set(g.id, { ...prev, ...g, _pkg: meta.id });
      }
    }

    // Chains / instruments / guides / patches
    const chains = pkg?.data?.chains;
    if(chains){
      if(Array.isArray(chains.instruments)){
        for(const inst of chains.instruments){
          const prev = this.instruments.get(inst.id) || {};
          this.instruments.set(inst.id, { ...prev, ...inst, _pkg: meta.id });
        }
      }
      if(chains.baseChains && meta.type === "core"){
        this.baseChains = chains.baseChains;
      }else if(chains.baseChains){
        // DLC may contribute new base chains (rare but allowed)
        this.baseChains = deepMerge(this.baseChains, chains.baseChains);
      }
      if(chains.genreGuides){
        this.genreGuides = deepMerge(this.genreGuides, chains.genreGuides);
      }
      if(chains.patch?.chainMods?.length){
        this.chainMods.push(...chains.patch.chainMods);
      }
    }
  }

  getGenres(){
    return Array.from(this.genres.values()).sort((a,b)=> a.name.localeCompare(b.name, "pt-BR"));
  }

  getGenre(id){
    return this.genres.get(id) || null;
  }

  getInstruments(){
    return Array.from(this.instruments.values());
  }

  getInstrument(id){
    return this.instruments.get(id) || null;
  }

  /** Returns a merged chain (base + optional genre patch ops). */
  getChain(genreId, instrumentId, level){
    const base = this.baseChains?.[instrumentId]?.[level];
    if(!base) return null;

    const chain = deepClone(base);
    chain.steps = Array.isArray(chain.steps) ? chain.steps : [];

    // Apply chain mods that match
    for(const op of this.chainMods){
      if(op.genreId !== genreId) continue;
      if(op.instrumentId !== instrumentId) continue;
      if(op.level !== level) continue;
      if(!Array.isArray(op.steps) || !op.steps.length) continue;

      if(op.mode === "insertAfter"){
        const idx = chain.steps.findIndex(s => s.id === op.afterStepId);
        const at = idx >= 0 ? idx + 1 : chain.steps.length;
        chain.steps.splice(at, 0, ...deepClone(op.steps));
      }else if(op.mode === "insertBefore"){
        const idx = chain.steps.findIndex(s => s.id === op.beforeStepId);
        const at = idx >= 0 ? idx : 0;
        chain.steps.splice(at, 0, ...deepClone(op.steps));
      }else if(op.mode === "append"){
        chain.steps.push(...deepClone(op.steps));
      }else if(op.mode === "replaceAll"){
        chain.steps = deepClone(op.steps);
      }
    }

    // Attach guide info for UI
    const guide = this.genreGuides?.[genreId]?.instrumentNotes?.[instrumentId] || null;
    return { chain, guide };
  }

  getGenreGuide(genreId){
    return this.genreGuides?.[genreId] || null;
  }

  /** List loaded packages (builtin + local). */
  getPackages(){
    // unique by id, last wins
    const map = new Map();
    for(const p of this.packages) map.set(p.id, p);
    return Array.from(map.values()).sort((a,b)=> (a.type===b.type? a.name.localeCompare(b.name): (a.type==="core" ? -1: 1)));
  }
}
