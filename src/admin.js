import { icon } from "./ui/icons.js";
import { storage, downloadJSON } from "./utils/storage.js";
import { delegate, uid } from "./utils/dom.js";
import { contentManager } from "./content/manager.js";
import { showToast } from "./ui/toast.js";

const root = document.getElementById("admin");

const state = {
  tab: "packages", // packages | install | editor | backup | security
  logged: false,
  editingId: null,
};

function hex(buffer){
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function sha256(text){
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return hex(hash);
}

async function ensureAdminPassword(){
  let h = storage.get("adminHash", null);
  if(!h){
    // Default password: admin
    h = await sha256("admin");
    storage.set("adminHash", h);
  }
  return h;
}

function shell(html){
  root.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="row">
          <a class="brand" href="./index.html#/home" aria-label="Voltar ao app">
            <div class="logo">${icon("shield")}</div>
            <div class="title">
              <b>MixBlueprint Admin</b>
              <span>Gerencie DLCs e conteúdo (local)</span>
            </div>
          </a>

          <div class="top-actions">
            ${state.logged ? `<button class="iconbtn" data-logout title="Sair">${icon("logout")}</button>` : ``}
          </div>
        </div>
      </header>

      <main class="view">
        <div class="container">${html}</div>
      </main>
    </div>
  `;
}

function tabBar(){
  const tabs = [
    ["packages","Pacotes"],
    ["install","Instalar DLC"],
    ["editor","Criar/Editar"],
    ["backup","Backup"],
    ["security","Segurança"],
  ];
  return `
    <div class="toolbar">
      <div class="seg">
        ${tabs.map(([id,label]) => `<button class="${state.tab===id?"active":""}" data-tab="${id}">${label}</button>`).join("")}
      </div>
    </div>
  `;
}

function loginView(){
  shell(`
    <div class="card glass loginCard">
      <h1 style="margin:0 0 6px;font-size:18px;letter-spacing:.2px;">Entrar no Admin</h1>
      <p class="small" style="margin:0 0 14px;">
        Este login é <b>local</b> (localStorage) — serve para modo estático. Em produção, troque por backend.
      </p>

      <div class="form">
        <div class="field">
          <label>Senha</label>
          <input id="pw" type="password" placeholder="Padrão: admin" autocomplete="current-password"/>
        </div>
        <button class="btn primary" data-login>${icon("shield")} Entrar</button>
      </div>

      <hr class="sep"/>

      <div class="notice warn">
        <b>Padrão:</b> senha inicial é <span class="codePill">admin</span>. Troque na aba <b>Segurança</b>.
      </div>
    </div>
  `);
}

async function listAllPackages(){
  const registry = await (await fetch("./content/registry.json", { cache:"no-store" })).json();
  const overrides = storage.get("enabledPackages", {});
  const builtin = (registry?.packages || []).map(p => ({
    id: p.id,
    type: "builtin",
    required: !!p.required,
    path: p.path,
    enabled: p.required ? true : (overrides[p.id] ?? p.enabled ?? false),
  }));
  const local = storage.get("localPackages", []).map(p => ({
    id: p.manifest.id,
    type: "local",
    required: false,
    enabled: overrides[p.manifest.id] ?? (p.enabled ?? true),
    manifest: p.manifest
  }));
  return { builtin, local };
}

function pkgCard(p){
  const name = p.type === "builtin" ? p.id : (p.manifest?.name || p.id);
  const version = p.type === "builtin" ? "" : (p.manifest?.version || "0.0.0");
  const desc = p.type === "builtin" ? (p.required ? "Core (obrigatório)" : "DLC embutido") : (p.manifest?.description || "DLC local");
  const toggle = p.required ? `<span class="codePill">LOCK</span>` : `<div class="toggle ${p.enabled?"on":""}" data-toggle="${p.id}" role="switch" aria-checked="${p.enabled}"></div>`;
  const actions = p.type === "local" ? `
    <button class="iconbtn" title="Editar" data-edit="${p.id}">${icon("book")}</button>
    <button class="iconbtn" title="Exportar" data-export-dlc="${p.id}">${icon("bolt")}</button>
    <button class="iconbtn" title="Remover" data-delete="${p.id}">${icon("trash")}</button>
  ` : `
    <button class="iconbtn" title="Ver manifest" data-open-manifest="${p.id}">${icon("search")}</button>
  `;
  return `
    <div class="card pkg">
      <div class="left">${icon(p.type==="builtin" ? "shield":"bolt")}</div>
      <div class="mid">
        <b>${name}</b>
        <span>${desc}${version ? ` • v${version}`:""}</span>
      </div>
      <div class="actions">
        ${toggle}
        ${actions}
      </div>
    </div>
  `;
}

function packagesViewHTML(builtin, local){
  return `
    ${tabBar()}

    <div class="section">
      <h2>Pacotes embutidos</h2>
      <div class="adminGrid">
        ${builtin.map(pkgCard).join("")}
      </div>
      <div class="small" style="margin-top:8px;">DLCs embutidos vivem em <span class="codePill">/content/dlc/</span>.</div>
    </div>

    <div class="section">
      <h2>Pacotes locais</h2>
      ${local.length ? `<div class="adminGrid">${local.map(pkgCard).join("")}</div>` : `<div class="notice">Nenhum DLC local instalado ainda. Use a aba <b>Instalar DLC</b>.</div>`}
    </div>

    <div class="section">
      <div class="notice warn">
        <b>Importante:</b> o toggle só muda o que o app carrega. Atualize o app (F5) para recarregar conteúdo.
      </div>
    </div>
  `;
}

function installViewHTML(){
  return `
    ${tabBar()}
    <div class="section">
      <h2>Instalar DLC (JSON Bundle)</h2>
      <div class="card glass" style="padding:14px;">
        <p class="small" style="margin:0 0 10px;">
          Importe um arquivo <b>.json</b> no formato de bundle do MixBlueprint.
        </p>
        <label class="btn primary" style="cursor:pointer">
          ${icon("plus")} Importar DLC
          <input id="dlcFile" type="file" accept="application/json" style="display:none"/>
        </label>
      </div>
    </div>

    <div class="section">
      <h2>Template rápido</h2>
      <div class="card glass" style="padding:14px;">
        <p class="small" style="margin:0 0 10px;">
          Gere um bundle base para começar um DLC do zero.
        </p>

        <div class="form">
          <div class="row2">
            <div class="field">
              <label>ID (ex.: dlc_meu_pack)</label>
              <input id="tplId" placeholder="dlc_meu_pack"/>
            </div>
            <div class="field">
              <label>Versão</label>
              <input id="tplVer" placeholder="0.1.0"/>
            </div>
          </div>
          <div class="field">
            <label>Nome</label>
            <input id="tplName" placeholder="Meu DLC"/>
          </div>
          <div class="field">
            <label>Descrição</label>
            <input id="tplDesc" placeholder="O que este DLC adiciona?"/>
          </div>

          <button class="btn" data-generate>${icon("book")} Gerar template (e abrir editor)</button>
        </div>
      </div>
    </div>
  
    <div class="section">
      <h2>Asset Vault (imagens locais)</h2>
      <div class="card glass" style="padding:14px;">
        <p class="small" style="margin:0 0 10px;">
          Faça upload de imagens para prototipagem. Elas ficam salvas como <b>data URL</b> no localStorage.
        </p>

        <label class="btn" style="cursor:pointer">
          ${icon("plus")} Enviar imagem
          <input id="assetFile" type="file" accept="image/*" style="display:none"/>
        </label>

        <div class="small" style="margin-top:10px;">
          Atenção: localStorage tem limite. Para produção, use storage em servidor/CDN.
        </div>

        <div id="assetList" style="margin-top:12px;"></div>
      </div>
    </div>
`;
}

function editorViewHTML(initialJSON=""){
  return `
    ${tabBar()}
    <div class="section">
      <h2>Editor (bundle JSON)</h2>
      <div class="notice">
        Cole/edite o bundle. Clique <b>Validar</b> para checar JSON e <b>Salvar/Instalar</b> para gravar no localStorage.
      </div>
      <div class="card glass" style="padding:14px;margin-top:10px;">
        <div class="form">
          <div class="field">
            <label>Bundle JSON</label>
            <textarea id="bundleEditor" spellcheck="false" placeholder="{ ... }">${initialJSON}</textarea>
          </div>

          <div class="toolbar" style="margin:0;">
            <button class="btn" data-validate>${icon("search")} Validar</button>
            <button class="btn primary" data-save>${icon("shield")} Salvar / Instalar</button>
          </div>

          <div class="small">Dica: este editor aceita bundles completos (manifest + data). Assets podem ser data URLs, se você quiser.</div>
        </div>
      </div>
    </div>
  `;
}

function backupViewHTML(){
  return `
    ${tabBar()}
    <div class="section">
      <h2>Backup do app (localStorage)</h2>
      <div class="card glass" style="padding:14px;">
        <div class="row" style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn primary" data-export-all>${icon("book")} Exportar tudo</button>
          <label class="btn" style="cursor:pointer">
            ${icon("plus")} Importar tudo
            <input id="importAllAdmin" type="file" accept="application/json" style="display:none"/>
          </label>
          <button class="btn danger" data-reset>${icon("plus")} Reset local</button>
        </div>
        <p class="small" style="margin:10px 0 0;">Exporta favoritos, DLCs locais, toggles, senha do admin etc.</p>
      </div>
    </div>
  `;
}

function securityViewHTML(){
  return `
    ${tabBar()}
    <div class="section">
      <h2>Senha do Admin</h2>
      <div class="card glass" style="padding:14px;">
        <div class="form">
          <div class="field">
            <label>Senha atual</label>
            <input id="pwOld" type="password" placeholder="••••••••"/>
          </div>
          <div class="field">
            <label>Nova senha</label>
            <input id="pwNew" type="password" placeholder="mín. 6 caracteres"/>
          </div>
          <button class="btn primary" data-change-pw>${icon("shield")} Trocar senha</button>
        </div>

        <hr class="sep"/>

        <div class="notice warn">
          <b>Importante:</b> isto não é segurança real. Para produção, use autenticação no servidor.
        </div>
      </div>
    </div>
  `;
}

async function dashboard(){
  if(!state.logged){
    loginView();
    return;
  }

  if(state.tab === "packages"){
    const { builtin, local } = await listAllPackages();
    shell(packagesViewHTML(builtin, local));
    return;
  }
  if(state.tab === "install"){
    shell(installViewHTML());
    renderAssetList();
    return;
  }
  if(state.tab === "editor"){
    // If editing existing
    let initial = "";
    if(state.editingId){
      const pkgs = storage.get("localPackages", []);
      const pkg = pkgs.find(p => p?.manifest?.id === state.editingId);
      if(pkg){
        initial = JSON.stringify({
          bundleVersion: "1.0",
          manifest: pkg.manifest,
          data: pkg.data
        }, null, 2);
      }
    }
    shell(editorViewHTML(initial));
    return;
  }
  if(state.tab === "backup"){
    shell(backupViewHTML());
    return;
  }
  if(state.tab === "security"){
    shell(securityViewHTML());
    return;
  }

  state.tab = "packages";
  await dashboard();
}


function getAssets(){
  return storage.get("assetVault", []);
}
function saveAssets(list){
  storage.set("assetVault", list);
}
function renderAssetList(){
  const host = root.querySelector("#assetList");
  if(!host) return;
  const assets = getAssets();
  if(!assets.length){
    host.innerHTML = `<div class="notice">Nenhuma imagem enviada ainda.</div>`;
    return;
  }
  host.innerHTML = assets.map(a => `
    <div class="card pkg" style="margin-top:10px;">
      <div class="left">${icon("book")}</div>
      <div class="mid">
        <b>${a.name}</b>
        <span>ID: <span class="codePill">${a.id}</span> • ${(a.size/1024).toFixed(1)} KB</span>
      </div>
      <div class="actions">
        <button class="iconbtn" title="Copiar referência" data-asset-copy="${a.id}">${icon("arrow_up_right")}</button>
        <button class="iconbtn" title="Remover" data-asset-del="${a.id}">${icon("trash")}</button>
      </div>
    </div>
  `).join("");

  // Replace copy icon fallback (we don't have copy icon; show arrow_up_right)
  host.querySelectorAll("[data-asset-copy] svg").forEach(svg => {
    // If it's book fallback, fine; but we can add small transform
  });
}

function buildTemplate({id, ver, name, desc}){
  const gid = id || "dlc_meu_pack";
  const tpl = {
    bundleVersion: "1.0",
    manifest: {
      id: gid,
      type: "dlc",
      name: name || "Meu DLC",
      version: ver || "0.1.0",
      description: desc || "Descreva o que este DLC adiciona."
    },
    data: {
      genres: [
        {
          id: "meu_genero",
          name: "Meu Gênero",
          tagline: "Descreva o feeling e o objetivo.",
          bpm: "—",
          mixTargets: { track_peak_dbfs: "-12 a -6 dBFS (picos)" },
          masterTargets: { streaming_integrated_lufs: "-14 a -10 LUFS (I)", true_peak_dbtp: "-1.0 dBTP" },
          vibe: ["ex.: punch", "ex.: brilho"],
          accent: "aurora"
        }
      ],
      chains: {
        schemaVersion: "1.0",
        genreGuides: {
          meu_genero: {
            globalNotes: ["Anote decisões de referência para este gênero."],
            instrumentNotes: {
              vocal_lead: {
                focus: ["presença", "sibilância controlada"],
                variations: ["Ex.: mais de-esser no refrão."]
              },
              master: {
                focus: ["claridade", "dinâmica"],
                targets: { streaming_lufs_i: "-14 a -10 LUFS", true_peak: "≤ -1.0 dBTP" }
              }
            }
          }
        },
        patch: {
          chainMods: [
            {
              genreId: "meu_genero",
              instrumentId: "vocal_lead",
              level: "beginner",
              mode: "insertAfter",
              afterStepId: "hp",
              steps: [
                {
                  id: "meu_step",
                  type: "FX",
                  title: "Meu step extra",
                  purpose: "Explique o motivo.",
                  pluginExamples: ["Plugin A", "Plugin B"],
                  settings: [{ label: "Parâmetro", value: "valor", note: "nota" }],
                  meters: [],
                  tips: ["Dica 1"],
                  variations: [],
                  proTips: []
                }
              ]
            }
          ]
        }
      }
    }
  };
  return tpl;
}

/* Event wiring */
delegate(root, "click", "[data-login]", async () => {
  const pw = root.querySelector("#pw")?.value || "";
  const target = await ensureAdminPassword();
  const got = await sha256(pw);
  if(got === target){
    state.logged = true;
    showToast({ title:"Login OK", message:"Bem-vindo ao Admin.", kind:"ok" });
    await dashboard();
  }else{
    showToast({ title:"Senha incorreta", message:"Tente novamente.", kind:"warn" });
  }
});

delegate(root, "click", "[data-logout]", async () => {
  state.logged = false;
  state.tab = "packages";
  state.editingId = null;
  showToast({ title:"Saiu", message:"Sessão local encerrada.", kind:"ok" });
  await dashboard();
});

delegate(root, "click", "[data-tab]", async (e, el) => {
  state.tab = el.dataset.tab;
  state.editingId = null;
  await dashboard();
});

delegate(root, "click", "[data-toggle]", async (e, el) => {
  const id = el.dataset.toggle;
  const { builtin, local } = await listAllPackages();
  const pkg = [...builtin, ...local].find(p => p.id === id);
  if(!pkg || pkg.required) return;

  const next = !pkg.enabled;
  contentManager.setPackageEnabled(id, next);
  showToast({ title: next ? "Ativado" : "Desativado", message: id, kind:"ok" });
  await dashboard();
});

delegate(root, "click", "[data-edit]", async (e, el) => {
  state.editingId = el.dataset.edit;
  state.tab = "editor";
  await dashboard();
});

delegate(root, "click", "[data-export-dlc]", async (e, el) => {
  try{
    const id = el.dataset.exportDlc;
    const payload = contentManager.exportLocalPackage(id);
    downloadJSON(`${id}.mixblueprint.dlc.json`, payload);
    showToast({ title:"Exportado", message:"DLC baixado.", kind:"ok" });
  }catch(err){
    showToast({ title:"Erro", message:String(err?.message || err), kind:"warn" });
  }
});

delegate(root, "click", "[data-delete]", async (e, el) => {
  const id = el.dataset.delete;
  contentManager.removeLocalPackage(id);
  // Also remove override
  const overrides = storage.get("enabledPackages", {});
  delete overrides[id];
  storage.set("enabledPackages", overrides);

  showToast({ title:"Removido", message:id, kind:"ok" });
  await dashboard();
});

delegate(root, "click", "[data-open-manifest]", async (e, el) => {
  const id = el.dataset.openManifest;
  try{
    const reg = await (await fetch("./content/registry.json", { cache:"no-store" })).json();
    const pkg = (reg.packages || []).find(p => p.id === id);
    if(!pkg) throw new Error("Manifest não encontrado.");
    const m = await (await fetch("./"+pkg.path, { cache:"no-store" })).json();
    state.tab = "editor";
    state.editingId = null;
    await dashboard();
    root.querySelector("#bundleEditor").value = JSON.stringify({ bundleVersion:"1.0", manifest:m, data:{ note:"Builtin pacote. Para alterar, edite os arquivos em /content/ e faça deploy." } }, null, 2);
    showToast({ title:"Manifest carregado", message:"Pacote embutido é editado no repositório.", kind:"ok", ms:3200 });
  }catch(err){
    showToast({ title:"Erro", message:String(err?.message || err), kind:"warn" });
  }
});

delegate(root, "change", "#dlcFile", async (e, el) => {
  const file = el.files?.[0];
  if(!file) return;
  try{
    const payload = JSON.parse(await file.text());
    const id = contentManager.installLocalPackage(payload);
    // enable by default
    contentManager.setPackageEnabled(id, true);
    showToast({ title:"Instalado", message:`${id} • Ativado`, kind:"ok" });
    state.tab = "packages";
    await dashboard();
  }catch(err){
    showToast({ title:"Falha ao instalar", message:String(err?.message || err), kind:"warn", ms:3600 });
  }finally{
    el.value = "";
  }
});

async function copyText(text){
  const t = String(text ?? "");
  try{
    await navigator.clipboard.writeText(t);
  }catch{
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try{ document.execCommand("copy"); }finally{ ta.remove(); }
  }
}

delegate(root, "change", "#assetFile", async (e, el) => {
  const file = el.files?.[0];
  if(!file) return;
  try{
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error || new Error("Falha ao ler arquivo."));
      r.readAsDataURL(file);
    });
    const assets = getAssets();
    const id = uid("asset");
    assets.unshift({
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      createdAt: new Date().toISOString()
    });
    saveAssets(assets);
    renderAssetList();
    showToast({ title:"Imagem salva", message:`asset:${id}`, kind:"ok" });
  }catch(err){
    showToast({ title:"Falha no upload", message:String(err?.message || err), kind:"warn" });
  }finally{
    el.value = "";
  }
});

delegate(root, "click", "[data-asset-copy]", async (e, el) => {
  const id = el.dataset.assetCopy;
  await copyText(`asset:${id}`);
  showToast({ title:"Copiado", message:`asset:${id}`, kind:"ok" });
});

delegate(root, "click", "[data-asset-del]", async (e, el) => {
  const id = el.dataset.assetDel;
  const assets = getAssets().filter(a => a.id !== id);
  saveAssets(assets);
  renderAssetList();
  showToast({ title:"Removido", message:id, kind:"ok" });
});


delegate(root, "click", "[data-generate]", async () => {
  const id = root.querySelector("#tplId")?.value || "dlc_meu_pack";
  const ver = root.querySelector("#tplVer")?.value || "0.1.0";
  const name = root.querySelector("#tplName")?.value || "Meu DLC";
  const desc = root.querySelector("#tplDesc")?.value || "Descreva o que este DLC adiciona.";

  const tpl = buildTemplate({id, ver, name, desc});
  state.tab = "editor";
  state.editingId = null;
  await dashboard();
  root.querySelector("#bundleEditor").value = JSON.stringify(tpl, null, 2);
  showToast({ title:"Template pronto", message:"Edite e salve para instalar.", kind:"ok" });
});

delegate(root, "click", "[data-validate]", async () => {
  const txt = root.querySelector("#bundleEditor")?.value || "";
  try{
    const obj = JSON.parse(txt);
    if(!obj?.manifest?.id) throw new Error("manifest.id é obrigatório.");
    showToast({ title:"JSON OK", message:`Bundle: ${obj.manifest.id}`, kind:"ok" });
  }catch(err){
    showToast({ title:"JSON inválido", message:String(err?.message || err), kind:"warn", ms:3600 });
  }
});

delegate(root, "click", "[data-save]", async () => {
  const txt = root.querySelector("#bundleEditor")?.value || "";
  try{
    const obj = JSON.parse(txt);
    const id = contentManager.installLocalPackage(obj);
    contentManager.setPackageEnabled(id, true);
    showToast({ title:"Salvo/Instalado", message:`${id} • Ativado`, kind:"ok" });
    state.tab = "packages";
    await dashboard();
  }catch(err){
    showToast({ title:"Erro ao salvar", message:String(err?.message || err), kind:"warn", ms:3600 });
  }
});

delegate(root, "click", "[data-export-all]", () => {
  downloadJSON(`mixblueprint-backup-${new Date().toISOString().slice(0,10)}.json`, storage.exportAll());
  showToast({ title:"Exportado", message:"Backup baixado.", kind:"ok" });
});

delegate(root, "change", "#importAllAdmin", async (e, el) => {
  const file = el.files?.[0];
  if(!file) return;
  try{
    const payload = JSON.parse(await file.text());
    storage.importAll(payload);
    showToast({ title:"Importado", message:"Recarregando Admin…", kind:"ok", ms:1800 });
    setTimeout(()=> location.reload(), 350);
  }catch(err){
    showToast({ title:"Falha ao importar", message:String(err?.message || err), kind:"warn", ms:3600 });
  }finally{
    el.value = "";
  }
});

delegate(root, "click", "[data-reset]", () => {
  if(!confirm("Resetar TODOS os dados locais (favoritos, DLCs, senha, etc.)?")) return;
  for(const k of storage.keys()) storage.del(k);
  showToast({ title:"Reset", message:"Dados locais apagados. Recarregando…", kind:"ok", ms:1800 });
  setTimeout(()=> location.reload(), 350);
});

delegate(root, "click", "[data-change-pw]", async () => {
  const oldPw = root.querySelector("#pwOld")?.value || "";
  const newPw = root.querySelector("#pwNew")?.value || "";
  if(newPw.length < 6){
    showToast({ title:"Senha fraca", message:"Use pelo menos 6 caracteres.", kind:"warn" });
    return;
  }
  const target = storage.get("adminHash", null) || await ensureAdminPassword();
  const got = await sha256(oldPw);
  if(got !== target){
    showToast({ title:"Senha atual incorreta", message:"Verifique e tente novamente.", kind:"warn" });
    return;
  }
  storage.set("adminHash", await sha256(newPw));
  root.querySelector("#pwOld").value = "";
  root.querySelector("#pwNew").value = "";
  showToast({ title:"Senha trocada", message:"Atualizado no localStorage.", kind:"ok" });
});

(async function init(){
  await ensureAdminPassword();
  // Auto-login? no.
  await dashboard();
})();
