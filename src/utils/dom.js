export const $ = (sel, el=document) => el.querySelector(sel);
export const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

export function on(el, event, handler, opts){
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
}

/** Event delegation */
export function delegate(el, event, selector, handler){
  return on(el, event, (e) => {
    const t = e.target?.closest?.(selector);
    if(t && el.contains(t)) handler(e, t);
  });
}

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function h(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

export function copyToClipboard(text){
  const t = String(text ?? "");
  if(navigator.clipboard?.writeText){
    return navigator.clipboard.writeText(t);
  }
  // Fallback
  const ta = document.createElement("textarea");
  ta.value = t;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try{ document.execCommand("copy"); }finally{ ta.remove(); }
  return Promise.resolve();
}

export function uid(prefix="id"){
  return prefix + "_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}
