import { icon } from "./icons.js";
import { delegate } from "../utils/dom.js";

let wrap = null;
let timer = null;

export function ensureToast(){
  if(wrap) return wrap;
  wrap = document.createElement("div");
  wrap.className = "toastWrap";
  wrap.innerHTML = `<div class="toast" style="display:none"></div>`;
  document.body.appendChild(wrap);
  delegate(wrap, "click", "[data-toast-close]", () => hideToast());
  return wrap;
}

export function showToast({title="OK", message="", kind="info", ms=2600}={}){
  ensureToast();
  const box = wrap.querySelector(".toast");
  const ico = kind === "ok" ? "bolt" : (kind === "warn" ? "shield" : "plus");
  box.innerHTML = `
    ${icon(ico)}
    <div>
      <b>${title}</b>
      ${message ? `<span>${message}</span>` : ``}
    </div>
    <button class="iconbtn x" data-toast-close title="Fechar">${icon("x")}</button>
  `;
  box.style.display = "flex";
  box.classList.add("fadeIn");

  clearTimeout(timer);
  timer = setTimeout(hideToast, ms);
}

export function hideToast(){
  if(!wrap) return;
  const box = wrap.querySelector(".toast");
  box.style.display = "none";
}
