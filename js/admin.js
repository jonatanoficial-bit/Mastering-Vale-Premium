
import { Store } from "./store.js";

const store = new Store("mixblueprint_pro_v2");

function $(id){ return document.getElementById(id); }
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove("show"), 1700);
}

function sha256(str){
  // small browser sha256 via SubtleCrypto
  const enc = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", enc).then(buf=>{
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b=> b.toString(16).padStart(2,"0")).join("");
  });
}

async function ensureDefaultPass(){
  if(!store.getAdminHash()){
    const h = await sha256("admin");
    store.setAdminHash(h);
  }
}

async function login(){
  const pass = $("pass").value || "";
  const h = await sha256(pass);
  if(h === store.getAdminHash()){
    localStorage.setItem("mixblueprint_pro_v2:admin_authed", "1");
    render();
    toast("Login ok");
  }else{
    toast("Senha inválida");
  }
}

function logout(){
  localStorage.removeItem("mixblueprint_pro_v2:admin_authed");
  render();
}

function isAuthed(){
  return localStorage.getItem("mixblueprint_pro_v2:admin_authed")==="1";
}

function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj,null,2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

function readFileAsText(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(String(r.result||""));
    r.onerror = ()=> reject(r.error);
    r.readAsText(file);
  });
}

async function loadRegistry(){
  const res = await fetch("./content/registry.json", {cache:"no-store"});
  return await res.json();
}

function card(title, desc){
  const wrap = document.createElement("div");
  wrap.className="card";
  wrap.innerHTML = `<div class="hd"><div><h2>${title}</h2><p>${desc}</p></div><span class="badge">Admin</span></div><div class="bd" id="bd"></div>`;
  return wrap;
}

async function render(){
  const root = $("root");
  root.innerHTML = "";

  const header = document.createElement("div");
  header.className = "topbar safe";
  header.innerHTML = `
    <div class="topbar-inner">
      <div class="brand" onclick="location.href='./index.html#/'" style="cursor:pointer">
        <img src="./assets/icons/logo.svg" alt="logo"/>
        <div class="title">
          <strong>MixBlueprint Pro — Admin</strong>
          <span>Gerenciar DLCs, pacotes e backups (local)</span>
        </div>
      </div>
      <div class="pills">
        <a class="pill" href="./index.html#/">App</a>
        <a class="pill" href="./index.html#/browse">Explorar</a>
        <a class="pill" href="./index.html#/master">Master</a>
      </div>
    </div>
  `;
  root.appendChild(header);

  const main = document.createElement("div");
  main.className = "admin-wrap";
  root.appendChild(main);

  if(!isAuthed()){
    const c = document.createElement("div");
    c.className="card accent";
    c.innerHTML = `
      <div class="hd">
        <div>
          <h2>Login (local)</h2>
          <p>Senha padrão: <b>admin</b> (altere depois). Isso não é segurança real; é modo local para produção de conteúdo.</p>
        </div>
        <span class="badge">Segurança</span>
      </div>
      <div class="bd">
        <div class="row" style="width:100%">
          <div style="flex:1;min-width:220px">
            <input id="pass" type="password" placeholder="Senha"/>
          </div>
          <button id="btnLogin" class="btn primary">Entrar</button>
        </div>
        <div class="div"></div>
        <div class="row">
          <a class="btn" href="./index.html#/">Voltar ao app</a>
        </div>
      </div>
    `;
    main.appendChild(c);
    $("btnLogin").onclick = login;
    return;
  }

  // authed content
  const grid = document.createElement("div");
  grid.className = "grid two";
  main.appendChild(grid);

  // Package toggles
  const registry = await loadRegistry();
  const pkgCard = document.createElement("div");
  pkgCard.className="card";
  pkgCard.innerHTML = `
    <div class="hd">
      <div><h2>Pacotes (Core + DLC)</h2><p>Ative/desative pacotes. DLCs locais instalados também aparecem aqui.</p></div>
      <button id="btnLogout" class="btn">Sair</button>
    </div>
    <div class="bd" id="pkgBd"></div>
  `;
  grid.appendChild(pkgCard);
  $("btnLogout").onclick = logout;

  const pkgBd = pkgCard.querySelector("#pkgBd");
  const overrides = store.getPackageOverrides();
  const localDlcs = store.getLocalDlcs();

  const all = [
    ...registry.packages.map(p=>({id:p.id, name:p.name, type:p.type, version:p.version, enabled: overrides[p.id]?.enabled ?? p.enabledByDefault ?? true})),
    ...localDlcs.map(p=>({id:p.id, name:p.name, type:"dlc_local", version:p.version, enabled: overrides[p.id]?.enabled ?? true, __local:true}))
  ];

  const list = document.createElement("div");
  list.className="list";
  all.forEach(p=>{
    const row = document.createElement("div");
    row.className="item";
    row.innerHTML = `
      <div class="meta">
        <strong>${p.name}</strong>
        <span><span class="mono">${p.id}</span> • v${p.version} • ${p.type}</span>
      </div>
      <div class="row" style="gap:8px">
        <span class="badge">${p.enabled?"Ativo":"Inativo"}</span>
        <button class="btn ${p.enabled?"":"primary"}" data-id="${p.id}">${p.enabled?"Desativar":"Ativar"}</button>
        ${p.__local? `<button class="btn danger" data-rm="${p.id}">Remover</button>`:""}
      </div>
    `;
    list.appendChild(row);
  });
  pkgBd.appendChild(list);

  pkgBd.addEventListener("click",(e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;
    const id = t.getAttribute("data-id");
    if(id){
      const p = all.find(x=> x.id===id);
      store.setPackageEnabled(id, !(p?.enabled));
      toast("Atualizado. Recarregue o app para aplicar.");
      render();
    }
    const rm = t.getAttribute("data-rm");
    if(rm){
      store.removeLocalDlc(rm);
      toast("DLC local removida");
      render();
    }
  });

  // Install DLC bundle
  const dlcCard = document.createElement("div");
  dlcCard.className="card accent";
  dlcCard.innerHTML = `
    <div class="hd">
      <div><h2>Instalar DLC (bundle JSON)</h2><p>Importe um bundle (manifest + data) sem mexer no core. Ideal para criar packs comerciais.</p></div>
      <span class="badge">DLC</span>
    </div>
    <div class="bd">
      <div class="row">
        <input id="dlcFile" type="file" accept="application/json"/>
        <button id="btnInstall" class="btn primary">Instalar</button>
      </div>
      <div class="div"></div>
      <div class="row">
        <button id="btnTemplate" class="btn">Gerar template de DLC</button>
        <a class="btn" href="./examples/lofi_pack.bundle.json" download>Baixar exemplo</a>
      </div>
      <div class="div"></div>
      <div class="row">
        <button id="btnBackup" class="btn">Exportar Backup</button>
        <input id="backupFile" type="file" accept="application/json"/>
        <button id="btnRestore" class="btn danger">Restaurar Backup</button>
      </div>
    </div>
  `;
  grid.appendChild(dlcCard);

  $("btnInstall").onclick = async ()=>{
    const f = $("dlcFile").files?.[0];
    if(!f) return toast("Selecione um arquivo .json");
    try{
      const txt = await readFileAsText(f);
      const obj = JSON.parse(txt);
      if(!obj?.package?.id || !obj?.package?.files) throw new Error("Bundle inválido");
      store.installLocalDlc(obj);
      toast("DLC instalada (local)");
      render();
    }catch(err){
      toast("Falha ao instalar DLC");
    }
  };

  $("btnTemplate").onclick = ()=>{
    const template = {
      "bundleVersion":1,
      "package":{
        "id":"dlc_meu_pack",
        "name":"Meu Pack (Exemplo)",
        "type":"dlc",
        "version":"1.0.0",
        "enabledByDefault": true,
        "files":{
          "manifest.json":{
            "id":"dlc_meu_pack",
            "name":"Meu Pack (Exemplo)",
            "version":"1.0.0",
            "schemaVersion":2,
            "assets":[],
            "data":[
              {"type":"genres","path":"data/genres.json"},
              {"type":"blueprints","path":"data/blueprints.json"}
            ]
          },
          "data/genres.json":{
            "genres":[{"id":"meu_genero","name":"Meu Gênero","accent":"#9CF0FF","stageAccent":{"mix":"#9CF0FF","master":"#FFB3E1"}}]
          },
          "data/blueprints.json":{
            "schemaVersion":2,
            "blueprints":[
              {
                "id":"bp_meu_exemplo",
                "genreId":"meu_genero",
                "instrumentId":"vocal_lead",
                "title":"Blueprint Exemplo",
                "summary":"Descreva aqui.",
                "levels":{"beginner":{"label":"Iniciante","focus":["x"]},"intermediate":{"label":"Intermediário","focus":["y"]},"advanced":{"label":"Avançado","focus":["z"]}},
                "decisions":[
                  {"id":"vibe","label":"Vibe","type":"segmented","options":[{"id":"natural","label":"Natural"},{"id":"commercial","label":"Comercial"}],"default":"commercial"}
                ],
                "targets":{"lufs_s":{"label":"LUFS Short","min":-20,"max":-12,"unit":"LUFS"}},
                "baseChain":[
                  {"id":"gain","name":"Gain","type":"utility","why":"Por quê.","settingsByLevel":{"beginner":{"text":"..."}, "intermediate":{"text":"..."}, "advanced":{"text":"..."}}}
                ],
                "rules":[
                  {"when":{"vibe":"natural"},"patch":[{"op":"update","stepId":"gain","fields":{"note":"Nota para natural."}}],"meterBias":{"lufs_s":-1}}
                ]
              }
            ]
          }
        }
      }
    };
    downloadJson("dlc_template.bundle.json", template);
    toast("Template gerado");
  };

  $("btnBackup").onclick = ()=>{
    const all = store.exportAll();
    downloadJson("mixblueprint_backup.json", all);
    toast("Backup exportado");
  };

  $("btnRestore").onclick = async ()=>{
    const f = $("backupFile").files?.[0];
    if(!f) return toast("Selecione um backup .json");
    try{
      const txt = await readFileAsText(f);
      const obj = JSON.parse(txt);
      store.importAll(obj);
      toast("Backup restaurado");
      render();
    }catch{
      toast("Falha ao restaurar");
    }
  };

  // Security: change pass
  const sec = document.createElement("div");
  sec.className="card";
  sec.innerHTML = `
    <div class="hd">
      <div><h2>Segurança (local)</h2><p>Troque a senha do Admin. (Armazenamento local com hash.)</p></div>
      <span class="badge">Senha</span>
    </div>
    <div class="bd">
      <div class="row" style="width:100%">
        <div style="flex:1;min-width:220px">
          <input id="newPass" type="password" placeholder="Nova senha"/>
        </div>
        <button id="btnSetPass" class="btn primary">Salvar</button>
      </div>
    </div>
  `;
  main.appendChild(sec);

  $("btnSetPass").onclick = async ()=>{
    const p = $("newPass").value || "";
    if(p.length < 4) return toast("Senha muito curta");
    const h = await sha256(p);
    store.setAdminHash(h);
    toast("Senha atualizada");
    $("newPass").value="";
  };
}

(async ()=>{
  await ensureDefaultPass();
  render();
})();
