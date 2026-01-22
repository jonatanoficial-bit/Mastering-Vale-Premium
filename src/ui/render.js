import { icon } from "./icons.js";
import { h } from "../utils/dom.js";
import { levelLabel, pickAccent, kpiLabel } from "../utils/format.js";

export function mountShell(root){
  root.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="row">
          <button class="iconbtn backbtn" id="backBtn" title="Voltar" aria-label="Voltar">${icon("back")}</button>

          <a class="brand" href="#/home" aria-label="Ir para início">
            <div class="logo">${icon("bolt")}</div>
            <div class="title">
              <b id="hdrTitle">MixBlueprint</b>
              <span id="hdrSub">Cadeias + medições (AAA)</span>
            </div>
          </a>

          <div class="top-actions">
            <a class="iconbtn" href="#/admin" id="adminBtn" title="Admin (local)" aria-label="Admin">${icon("shield")}</a>
          </div>
        </div>
      </header>

      <main class="view">
        <div class="container" id="view"></div>
      </main>

      <nav class="bottomnav" aria-label="Navegação">
        <div class="bar">
          <a class="tab" data-tab="home" href="#/home" title="Início" aria-label="Início">${icon("home")}</a>
          <a class="tab" data-tab="favorites" href="#/favorites" title="Favoritos" aria-label="Favoritos">${icon("heart")}</a>
          <a class="tab" data-tab="library" href="#/library" title="Biblioteca" aria-label="Biblioteca">${icon("book")}</a>
          <a class="tab" data-tab="settings" href="#/settings" title="Configurações" aria-label="Configurações">${icon("gear")}</a>
        </div>
      </nav>
    </div>
  `;

  // Fix admin link: keep SPA separate (admin.html)
  const adminBtn = root.querySelector("#adminBtn");
  adminBtn.href = "./admin.html";

  return {
    view: root.querySelector("#view"),
    titleEl: root.querySelector("#hdrTitle"),
    subEl: root.querySelector("#hdrSub"),
    backBtn: root.querySelector("#backBtn"),
    tabs: Array.from(root.querySelectorAll(".tab"))
  };
}

export function setHeader(shell, {title="MixBlueprint", subtitle="Cadeias + medições (AAA)", back=false, activeTab="home"}){
  shell.titleEl.textContent = title;
  shell.subEl.textContent = subtitle;

  if(back) shell.backBtn.classList.add("show");
  else shell.backBtn.classList.remove("show");

  for(const t of shell.tabs){
    t.classList.toggle("active", t.dataset.tab === activeTab);
  }
}

function genreBadges(genre){
  const bpm = genre?.bpm ? `<span class="badge">${icon("bolt")} <b>BPM</b> ${h(genre.bpm)}</span>` : "";
  const vibe = (genre?.vibe || []).slice(0,3).map(v => `<span class="badge">${h(v)}</span>`).join("");
  return bpm + vibe;
}

export function renderHome(store, state){
  const genres = store.getGenres();
  const cards = genres.map(g => `
    <div class="card genreCard glass clickable accent-${pickAccent(g)}" data-nav="/genre/${h(g.id)}" role="button" tabindex="0">
      <div class="name">${h(g.name)}</div>
      <div class="tag">${h(g.tagline || "")}</div>
      <div class="meta">${genreBadges(g)}</div>
    </div>
  `).join("");

  const dlcInfo = store.getPackages().filter(p => p.type === "dlc").length;

  return {
    header: { title: "MixBlueprint", subtitle: `Selecione um gênero • ${dlcInfo} DLC(s)`, back: false, activeTab:"home" },
    html: `
      <div class="hero">
        <h1>Cadeias profissionais por gênero, instrumento e nível.</h1>
        <p>
          Escolha um gênero, selecione o que você vai mixar (vocal/instrumento/bus) e veja uma cadeia mínima
          com <b>medições reais</b>, variações e recomendações de plugins (exemplos).
        </p>
        <div class="row">
          <span class="pill">${icon("shield")} Conteúdo modular (Core + DLC)</span>
          <span class="pill">${icon("bolt")} Mobile-first • 60fps</span>
          <span class="pill">${icon("book")} Biblioteca de métricas</span>
        </div>

        <div class="searchbar">
          <div class="ico">
            ${icon("search")}
            <input id="searchInput" type="search" placeholder="Buscar: ‘de‑esser’, ‘LUFS’, ‘sidechain’, ‘limiter’…" autocomplete="off"/>
          </div>
        </div>

        <div class="small" style="margin-top:10px;">
          Dica: busque por <kbd>LUFS</kbd>, <kbd>True Peak</kbd>, <kbd>Dynamic EQ</kbd> ou <kbd>808</kbd>.
        </div>
      </div>

      <div class="section">
        <h2>Gêneros</h2>
        <div class="grid cols2" id="genreGrid">
          ${cards}
        </div>
      </div>

      <div class="section">
        <h2>Notas importantes</h2>
        <div class="notice warn">
          <b>Valores são pontos de partida.</b> Música não é laboratório: a melhor decisão é a que soa bem no contexto.
          Use os medidores para orientar — e o ouvido para decidir.
        </div>
      </div>
    `,
    hooks: [
      (root) => {
        const input = root.querySelector("#searchInput");
        if(!input) return;
        input.addEventListener("input", () => {
          const q = (input.value || "").trim().toLowerCase();
          const grid = root.querySelector("#genreGrid");
          if(!grid) return;
          for(const card of grid.children){
            const txt = card.textContent.toLowerCase();
            card.style.display = q && !txt.includes(q) ? "none" : "";
          }
        });
      }
    ]
  };
}

export function renderGenre(store, genreId){
  const genre = store.getGenre(genreId);
  if(!genre){
    return {
      header: { title:"Não encontrado", subtitle:"Gênero inválido", back:true, activeTab:"home" },
      html: `<div class="notice warn"><b>Ops.</b> Esse gênero não existe no conteúdo carregado.</div>`
    };
  }

  const guide = store.getGenreGuide(genreId);
  const instruments = store.getInstruments().filter(i => i.id !== "master");
  const instCards = instruments.map(inst => {
    const has = !!store.getChain(genreId, inst.id, "beginner");
    return `
      <div class="card instrumentCard clickable" data-nav="/chain/${h(genreId)}/${h(inst.id)}" role="button" tabindex="0" style="${has ? "" : "opacity:.55"}">
        <div class="ic">${icon(inst.icon || "plus")}</div>
        <div class="txt">
          <b>${h(inst.name)}</b>
          <span>${has ? "Cadeia + medições • 3 níveis" : "Sem cadeia (ainda) — use como referência"}</span>
        </div>
      </div>
    `;
  }).join("");

  const kpiItems = [
    ...(genre.mixTargets ? Object.entries(genre.mixTargets).map(([k,v]) => ({k, v})) : []),
    ...(genre.masterTargets ? Object.entries(genre.masterTargets).map(([k,v]) => ({k, v})) : []),
  ].slice(0,6).map(it => `
    <div class="item"><b>${h(kpiLabel(it.k))}</b><span>${h(it.v)}</span></div>
  `).join("");

  const notes = (guide?.globalNotes || []).map(n => `<li>${h(n)}</li>`).join("");

  return {
    header: { title: genre.name, subtitle: genre.tagline || "Selecione instrumento ou master", back:true, activeTab:"home" },
    html: `
      <div class="hero accent-${pickAccent(genre)}">
        <h1>${h(genre.name)}</h1>
        <p>${h(genre.tagline || "")}</p>
        <div class="row">
          <span class="pill">${icon("bolt")} <b style="color:rgba(255,255,255,.92)">BPM</b>&nbsp;${h(genre.bpm || "—")}</span>
          <span class="pill">${icon("shield")} Targets por contexto</span>
        </div>
      </div>

      <div class="section">
        <h2>Targets (guia rápida)</h2>
        <div class="kpi">${kpiItems}</div>
      </div>

      <div class="section">
        <h2>Mix</h2>
        <div class="grid cols2">
          ${instCards}
          <div class="card instrumentCard clickable accent-${pickAccent(genre)}" data-nav="/chain/${h(genreId)}/master" role="button" tabindex="0">
            <div class="ic">${icon("crown")}</div>
            <div class="txt">
              <b>Masterização</b>
              <span>Do básico ao avançado (com targets)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Guia do gênero</h2>
        ${notes ? `<ul class="bullets">${notes}</ul>` : `<div class="notice">Sem notas específicas (por enquanto).</div>`}
      </div>

      <div class="section">
        <div class="notice ok">
          <b>Pro tip:</b> faça decisões de timbre com volume igualado (loudness match). Isso elimina o “efeito mais alto = melhor”.
        </div>
      </div>
    `
  };
}

function renderSettingsTable(rows){
  if(!rows?.length) return "";
  return `
    <div class="table">
      ${rows.map(r => `
        <div class="r">
          <b>${h(r.label)}</b>
          <span>${h(r.value)}${r.note ? `<i>${h(r.note)}</i>` : ``}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderChips(items){
  if(!items?.length) return "";
  return `<div class="chips">${items.map(x => `<span class="chip">${h(x)}</span>`).join("")}</div>`;
}

export function renderChain(store, genreId, instrumentId, level="beginner", state){
  const genre = store.getGenre(genreId);
  const instrument = store.getInstrument(instrumentId);
  const info = store.getChain(genreId, instrumentId, level);
  const chain = info?.chain || null;
  const guide = info?.guide || null;

  if(!genre || !instrument || !chain){
    return {
      header: { title:"Não encontrado", subtitle:"Cadeia indisponível", back:true, activeTab:"home" },
      html: `<div class="notice warn"><b>Ops.</b> Não encontrei essa cadeia no conteúdo carregado.</div>`
    };
  }

  const levelSeg = ["beginner","intermediate","advanced"].map(l => `
    <button class="${l===level ? "active":""}" data-level="${h(l)}">${h(levelLabel(l))}</button>
  `).join("");

  const favKey = `${genreId}:${instrumentId}`;
  const isFav = (state?.favorites || []).includes(favKey);

  const kpis = chain.targets ? Object.entries(chain.targets).map(([k,v]) => `
    <div class="item"><b>${h(k)}</b><span>${h(v)}</span></div>
  `).join("") : "";

  const guideBlock = (guide || store.getGenreGuide(genreId)?.instrumentNotes?.[instrumentId]) ? `
    <div class="section">
      <h2>Variações por gênero</h2>
      <div class="notice">
        ${guide?.focus?.length ? `<b>Foco:</b> ${h(guide.focus.join(" • "))}<br/>` : ``}
        ${(guide?.variations || []).map(v => `• ${h(v)}`).join("<br/>")}
      </div>
    </div>
  ` : "";

  const steps = (chain.steps || []).map((s, idx) => `
    <details class="step" ${idx===0 ? "open":""}>
      <summary>
        <div class="n">${idx+1}</div>
        <div class="t">
          <b>${h(s.title)}</b>
          <span>${h(s.type)} • ${h(s.purpose || "")}</span>
        </div>
        <div class="chev">${icon("chev")}</div>
      </summary>
      <div class="body">
        ${s.purpose ? `<p>${h(s.purpose)}</p>` : ``}
        ${s.pluginExamples?.length ? `<div class="small">Plugins (exemplos)</div>${renderChips(s.pluginExamples)}` : ``}
        ${s.settings?.length ? `<div class="small">Ajustes sugeridos</div>${renderSettingsTable(s.settings)}` : ``}
        ${s.meters?.length ? `<div class="small" style="margin-top:10px;">O que medir</div>${renderSettingsTable(s.meters.map(m=>({label:m.label, value:m.target})))}` : ``}
        ${s.tips?.length ? `<div class="small" style="margin-top:10px;">Dicas</div><ul class="bullets">${s.tips.map(t=>`<li>${h(t)}</li>`).join("")}</ul>` : ``}
        ${s.proTips?.length ? `<div class="small" style="margin-top:10px;">Pro tips</div><ul class="bullets">${s.proTips.map(t=>`<li>${h(t)}</li>`).join("")}</ul>` : ``}
      </div>
    </details>
  `).join("");

  const aux = (chain.auxSends || []).map(a => `
    <details class="step">
      <summary>
        <div class="n">${icon("plus")}</div>
        <div class="t">
          <b>${h(a.title)}</b>
          <span>Aux / Send • ${h(a.purpose || "")}</span>
        </div>
        <div class="chev">${icon("chev")}</div>
      </summary>
      <div class="body">
        ${a.purpose ? `<p>${h(a.purpose)}</p>` : ``}
        ${a.settings?.length ? `<div class="small">Ajustes sugeridos</div>${renderSettingsTable(a.settings)}` : ``}
        ${a.tips?.length ? `<div class="small" style="margin-top:10px;">Dicas</div><ul class="bullets">${a.tips.map(t=>`<li>${h(t)}</li>`).join("")}</ul>` : ``}
      </div>
    </details>
  `).join("");

  const checklist = (chain.checklist || []).map(x => `<li>${h(x)}</li>`).join("");

  return {
    header: { title: instrument.name, subtitle: `${genre.name} • ${levelLabel(level)}`, back:true, activeTab:"home" },
    html: `
      <div class="hero accent-${pickAccent(genre)}">
        <h1>${h(instrument.name)}</h1>
        <p>${h(genre.name)} • ${h(chain.goal || "")}</p>

        <div class="toolbar">
          <div class="seg" role="tablist" aria-label="Nível">${levelSeg}</div>
          <button class="btn primary" data-copy="1">${icon("book")} Copiar cadeia</button>
          <button class="btn" data-fav="${h(favKey)}">${icon("heart")} ${isFav ? "Favorito" : "Favoritar"}</button>
        </div>

        <div class="small">Dica: use <kbd>Copiar cadeia</kbd> para colar no seu bloco de notas / sessão.</div>
      </div>

      <div class="section">
        <h2>Targets (ponto de partida)</h2>
        ${kpis ? `<div class="kpi">${kpis}</div>` : `<div class="notice">Sem targets específicos nesta cadeia.</div>`}
      </div>

      ${guideBlock}

      ${checklist ? `
        <div class="section">
          <h2>Checklist rápido</h2>
          <ul class="bullets">${checklist}</ul>
        </div>
      ` : ""}

      <div class="section">
        <h2>Passos</h2>
        ${steps}
      </div>

      ${aux ? `
        <div class="section">
          <h2>Aux / Sends (opcional)</h2>
          ${aux}
        </div>
      ` : ""}

      <div class="section">
        <div class="notice warn">
          <b>Heads-up:</b> não existe ‘cadeia mágica’. Use isso como base e adapte ao material, ao arranjo e às referências.
        </div>
      </div>
    `
  };
}

export function renderFavorites(store, state){
  const favs = (state?.favorites || []);
  const items = favs.map(key => {
    const [genreId, instrumentId] = key.split(":");
    const g = store.getGenre(genreId);
    const i = store.getInstrument(instrumentId);
    if(!g || !i) return "";
    return `
      <div class="card instrumentCard clickable" data-nav="/chain/${h(g.id)}/${h(i.id)}">
        <div class="ic">${icon(i.icon || "heart")}</div>
        <div class="txt">
          <b>${h(i.name)}</b>
          <span>${h(g.name)} • abrir cadeia</span>
        </div>
      </div>
    `;
  }).join("");

  return {
    header: { title:"Favoritos", subtitle:"Suas cadeias salvas (local)", back:false, activeTab:"favorites" },
    html: `
      <div class="hero">
        <h1>Favoritos</h1>
        <p>Salve cadeias que você usa sempre. Fica tudo disponível offline (PWA) e em qualquer device (se exportar/importar).</p>
      </div>

      <div class="section">
        ${items ? `<div class="grid cols2">${items}</div>` : `<div class="notice">Sem favoritos ainda. Abra uma cadeia e toque em <b>Favoritar</b>.</div>`}
      </div>
    `
  };
}

export function renderLibrary(){
  return {
    header: { title:"Biblioteca", subtitle:"Métricas e checklist de medição", back:false, activeTab:"library" },
    html: `
      <div class="hero">
        <h1>Biblioteca de métricas</h1>
        <p>Glossário rápido — para tomar decisões com consistência (sem travar o fluxo criativo).</p>
      </div>

      <div class="section">
        <h2>Medidores essenciais</h2>
        <div class="kpi">
          <div class="item"><b>LUFS (Integrated / Short‑Term / Momentary)</b><span>Percepção de loudness ao longo do tempo. Útil para comparar com referências e metas de streaming.</span></div>
          <div class="item"><b>True Peak (dBTP)</b><span>Detecta picos inter‑sample. Ajuda a evitar distorção em conversão/streaming.</span></div>
          <div class="item"><b>RMS / VU</b><span>Média energética. Ótimo para gain staging (ex.: 0 VU ≈ -18 dBFS).</span></div>
          <div class="item"><b>Phase / Correlation</b><span>Checa compatibilidade mono e fase (especialmente em baixos e efeitos estéreo).</span></div>
          <div class="item"><b>Spectrum Analyzer</b><span>Visual de distribuição de frequências; confirme decisões (sem mixar “com os olhos”).</span></div>
          <div class="item"><b>Crest Factor</b><span>Diferença entre pico e média. Ajuda a avaliar punch e compressão excessiva.</span></div>
        </div>
      </div>

      <div class="section">
        <h2>Checklist rápido (mix → premaster)</h2>
        <ul class="bullets">
          <li>Headroom no master bus (picos ~ -6 dBFS no premaster).</li>
          <li>Low end mono até ~120 Hz (na maioria dos estilos modernos).</li>
          <li>Referência A/B com loudness igualado.</li>
          <li>Checar mono, fones e caixas pequenas.</li>
          <li>Evitar limitar pesado no mix bus (deixe para a master).</li>
        </ul>
      </div>

      <div class="section">
        <div class="notice ok">
          <b>Workflow pro:</b> leve tudo ao ponto com automação + decisões pequenas. “Menos plugins, mais intenção.”
        </div>
      </div>
    `
  };
}

export function renderSettings(store){
  const pkgs = store.getPackages();
  const pkgRows = pkgs.map(p => `<li><b>${h(p.name)}</b> <span class="small">(${h(p.type)} • v${h(p.version)} • ${h(p.source)})</span></li>`).join("");

  return {
    header: { title:"Configurações", subtitle:"Conteúdo, export/import, admin", back:false, activeTab:"settings" },
    html: `
      <div class="hero">
        <h1>Configurações</h1>
        <p>Este projeto é <b>estático</b> (GitHub Pages) e usa <b>localStorage</b> para favoritos e DLCs locais — pronto para evoluir para backend quando você quiser.</p>

        <div class="row">
          <button class="btn" data-export="1">${icon("book")} Exportar dados</button>
          <label class="btn" style="cursor:pointer">
            ${icon("plus")} Importar dados
            <input id="importAll" type="file" accept="application/json" style="display:none"/>
          </label>
          <a class="btn primary" href="./admin.html">${icon("shield")} Abrir Admin</a>
        </div>
      </div>

      <div class="section">
        <h2>Pacotes carregados</h2>
        <ul class="bullets">${pkgRows}</ul>
        <div class="small" style="margin-top:8px;">Ative/desative DLCs no <b>Admin</b>.</div>
      </div>

      <div class="section">
        <h2>Sobre segurança</h2>
        <div class="notice warn">
          <b>Login do Admin é local</b> (não é segurança real). Em produção, substitua por autenticação no backend.
        </div>
      </div>
    `,
    hooks: [
      (root) => {
        const file = root.querySelector("#importAll");
        if(file){
          // handled in app.js (we keep UI here)
        }
      }
    ]
  };
}
