import { storage } from "../utils/storage.js";
import { ContentStore } from "./store.js";

async function fetchJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`Falha ao carregar: ${path}`);
  return await res.json();
}

function basePath(url){
  const i = url.lastIndexOf("/");
  return i >= 0 ? url.slice(0, i+1) : "";
}

function normalizeBundle(bundle){
  // Expected: { bundleVersion, manifest, data }
  if(!bundle?.manifest?.id) throw new Error("Bundle inválido: sem manifest.id");
  return {
    source: "local",
    enabled: bundle.enabled !== false,
    manifest: bundle.manifest,
    data: bundle.data || {}
  };
}

export class ContentManager{
  constructor(){
    this.store = new ContentStore();
    this.registry = null;
  }

  getEnabledOverrides(){
    return storage.get("enabledPackages", {});
  }

  setPackageEnabled(id, enabled){
    const overrides = this.getEnabledOverrides();
    overrides[id] = !!enabled;
    storage.set("enabledPackages", overrides);
  }

  getLocalPackages(){
    return storage.get("localPackages", []);
  }

  saveLocalPackages(pkgs){
    storage.set("localPackages", pkgs);
  }

  installLocalPackage(bundle){
    const pkgs = this.getLocalPackages();
    const normalized = normalizeBundle(bundle);
    // Replace by id
    const next = pkgs.filter(p => p?.manifest?.id !== normalized.manifest.id);
    next.push(normalized);
    this.saveLocalPackages(next);
    return normalized.manifest.id;
  }

  removeLocalPackage(id){
    const pkgs = this.getLocalPackages();
    this.saveLocalPackages(pkgs.filter(p => p?.manifest?.id !== id));
  }

  exportLocalPackage(id){
    const pkgs = this.getLocalPackages();
    const pkg = pkgs.find(p => p?.manifest?.id === id);
    if(!pkg) throw new Error("Pacote não encontrado.");
    return {
      bundleVersion: "1.0",
      exportedAt: new Date().toISOString(),
      manifest: pkg.manifest,
      data: pkg.data
    };
  }

  async loadAll(){
    this.store = new ContentStore();
    this.registry = await fetchJSON("./content/registry.json");

    const overrides = this.getEnabledOverrides();
    const builtin = (this.registry?.packages || []).map(p => ({
      ...p,
      enabled: p.required ? true : (overrides[p.id] ?? p.enabled ?? false),
    }));

    // Load builtin packages
    for(const p of builtin){
      if(!p.enabled) continue;
      const manifest = await fetchJSON("./" + p.path);
      const bp = basePath("./" + p.path);
      const data = {};
      for(const [k, rel] of Object.entries(manifest.entrypoints || {})){
        data[k] = await fetchJSON(bp + rel);
      }
      this.store.applyPackage({
        source: "builtin",
        enabled: p.enabled,
        manifest,
        data: {
          genres: data.genres,
          chains: data.chains,
        }
      });
    }

    // Load local packages
    const local = this.getLocalPackages();
    for(const lp of local){
      const id = lp?.manifest?.id;
      const enabled = overrides[id] ?? lp.enabled ?? true;
      if(!enabled) continue;
      this.store.applyPackage({ source: "local", enabled, manifest: lp.manifest, data: lp.data });
    }

    return this.store;
  }
}

export const contentManager = new ContentManager();
