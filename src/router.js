/* Minimal hash router for GitHub Pages friendly SPA */
export function createRouter(){
  const routes = [];
  function add(pattern, handler){
    // pattern example: "/genre/:id"
    const keys = [];
    const re = new RegExp("^" + pattern
      .replaceAll("/", "\\/")
      .replace(/:([A-Za-z0-9_]+)/g, (_, k) => { keys.push(k); return "([^\\/]+)"; })
      + "$");
    routes.push({ pattern, re, keys, handler });
  }

  function match(path){
    for(const r of routes){
      const m = path.match(r.re);
      if(m){
        const params = {};
        r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i+1]));
        return { handler: r.handler, params };
      }
    }
    return null;
  }

  function getPath(){
    const hash = location.hash || "#/home";
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    const [path, query] = raw.split("?");
    const q = {};
    if(query){
      for(const part of query.split("&")){
        const [k,v] = part.split("=");
        if(!k) continue;
        q[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
    }
    return { path: path || "/home", query: q, raw };
  }

  const api = {
    add,
    start(){
      const onChange = () => {
        const { path, query } = getPath();
        const hit = match(path);
        if(hit) hit.handler(hit.params, query);
        else {
          // fallback to home
          navigate("/home", {}, true);
        }
      };
      window.addEventListener("hashchange", onChange);
      onChange();
    }
  };

  return api;
}

export function navigate(path, query={}, replace=false){
  const q = Object.entries(query)
    .filter(([,v]) => v !== undefined && v !== null && v !== "")
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  const next = "#"+ path + (q ? ("?"+q) : "");
  if(replace) location.replace(next);
  else location.hash = next;
}

export function backOrHome(){
  if(history.length > 1) history.back();
  else navigate("/home");
}
