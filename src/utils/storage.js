const PREFIX = "mbp.";

function safeParse(v, fallback){
  try{ return JSON.parse(v); }catch{ return fallback; }
}

export const storage = {
  get(key, fallback=null){
    try{
      const v = localStorage.getItem(PREFIX + key);
      if(v === null || v === undefined) return fallback;
      return safeParse(v, fallback);
    }catch{
      return fallback;
    }
  },
  set(key, value){
    try{
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    }catch{
      return false;
    }
  },
  del(key){
    try{ localStorage.removeItem(PREFIX + key); }catch{}
  },
  keys(){
    try{
      return Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).map(k => k.slice(PREFIX.length));
    }catch{
      return [];
    }
  },
  exportAll(){
    const out = {};
    for(const k of this.keys()){
      out[k] = this.get(k, null);
    }
    return {
      app: "MixBlueprint",
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      data: out
    };
  },
  importAll(payload){
    if(!payload?.data || typeof payload.data !== "object") throw new Error("Arquivo inválido.");
    for(const [k,v] of Object.entries(payload.data)){
      this.set(k, v);
    }
  }
};

export function downloadJSON(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
