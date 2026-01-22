
function el(tag, attrs={}, children=[]){
  const n = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==="class") n.className=v;
    else if(k==="html") n.innerHTML=v;
    else if(k.startsWith("on") && typeof v==="function") n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v);
  }
  (children||[]).forEach(c=> n.appendChild(c));
  return n;
}

function iconGlyph(kind){
  const map = {
    mic:"🎙️",
    drums:"🥁",
    bass:"🎚️",
    guitar:"🎸",
    keys:"🎹",
    bus:"🧩",
    master:"💿"
  };
  return map[kind] || "✨";
}

function sectionTitle(title, right=null){
  const wrap = el("div", {class:"section-title"});
  wrap.appendChild(el("h3",{html:title}));
  if(right) wrap.appendChild(right);
  return wrap;
}

export const ui = {
  topbar({onNav, current, accentName}){
    const bar = el("div",{class:"topbar safe"});
    const inner = el("div",{class:"topbar-inner"});
    const brand = el("div",{class:"brand", onclick: ()=> onNav("#/")});
    brand.appendChild(el("img",{src:"./assets/icons/logo.svg", alt:"MixBlueprint Pro"}));
    const title = el("div",{class:"title"});
    title.appendChild(el("strong",{html:"MixBlueprint Pro"}));
    title.appendChild(el("span",{html:`Modo: <span style="color:var(--accent);font-weight:600">${accentName}</span>`}));
    brand.appendChild(title);

    const pills = el("div",{class:"pills"});
    const mk = (label, target)=> el("button",{class:"pill", onclick: ()=> onNav(target), "aria-pressed": String(current===label)}, [el("span",{html:label})]);
    pills.appendChild(el("a",{class:"pill", href:"#/browse"}, [el("span",{html:"Explorar"})]));
    pills.appendChild(el("a",{class:"pill", href:"#/favorites"}, [el("span",{html:"Favoritos"})]));
    pills.appendChild(el("a",{class:"pill", href:"#/upgrade"}, [el("span",{html:"Upgrade"})]));
    pills.appendChild(el("a",{class:"pill", href:"./admin.html"}, [el("span",{html:"Admin"})]));

    inner.appendChild(brand);
    inner.appendChild(pills);
    bar.appendChild(inner);
    return bar;
  },

  home({genres, instruments, store, onBrowse, onFavorites}){
    const wrap = el("div",{class:"main"});
    const grid = el("div",{class:"grid two"});

    const left = el("div",{class:"card accent"});
    left.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Blueprints de Mix & Master — nível AAA"}),
        el("p",{html:"Selecione gênero e instrumento, responda decisões reais e receba cadeias detalhadas + alvos de medição. Feito para mobile, pronto para mercado."})
      ]),
      el("span",{class:"badge", html:"v2 — Interativo"})
    ]));
    const bd = el("div",{class:"bd"});
    bd.appendChild(el("div",{class:"row"},[
      el("button",{class:"btn primary", onclick:onBrowse},[el("span",{html:"Começar"})]),
      el("button",{class:"btn", onclick:onFavorites},[el("span",{html:`Favoritos (${store.getFavorites().length})`})]),
      el("a",{class:"btn ghost", href:"#/master"},[el("span",{html:"Masterização"})])
    ]));
    bd.appendChild(el("div",{class:"div"}));
    bd.appendChild(sectionTitle("Como funciona", el("span",{class:"kbd", html:"Atalho: /"})));
    bd.appendChild(el("div",{class:"list"},[
      info("1) Escolha o gênero","Cores e recomendações adaptam conforme estilo musical."),
      info("2) Selecione o instrumento/bus","Vocal, drums, bass, mix bus e master."),
      info("3) Decida (vibe, voz, arranjo...)","A cadeia muda em tempo real — como um assistente."),
      info("4) Use os targets como guia","LUFS/TP/GR/Dinâmica para checar direção.")
    ]));
    left.appendChild(bd);

    const right = el("div",{class:"card"});
    right.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Biblioteca rápida"}),
        el("p",{html:"Seletores rápidos para ir direto ao que importa."})
      ]),
      el("span",{class:"badge", html:"Mobile‑first"})
    ]));
    const bd2 = el("div",{class:"bd"});
    bd2.appendChild(sectionTitle("Gêneros disponíveis"));
    const gl = el("div",{class:"list"});
    genres.slice(0,8).forEach(g=>{
      const it = el("div",{class:"item", onclick: ()=> location.hash=`#/browse?g=${g.id}`});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:g.name}),
        el("span",{html:"Blueprints + Master modes"})
      ]));
      it.appendChild(el("span",{class:"badge", html:"Selecionar"}));
      gl.appendChild(it);
    });
    bd2.appendChild(gl);

    bd2.appendChild(el("div",{class:"div"}));
    bd2.appendChild(sectionTitle("Instrumentos"));
    const il = el("div",{class:"list"});
    instruments.slice(0,6).forEach(i=>{
      const it = el("div",{class:"item", onclick: ()=> location.hash=`#/blueprint?g=${genres[0]?.id||"pop"}&i=${i.id}&l=intermediate`});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:`${iconGlyph(i.icon)} ${i.name}`}),
        el("span",{html:(i.quickTags||[]).join(" • ")})
      ]));
      it.appendChild(el("span",{class:"badge", html:"Abrir"}));
      il.appendChild(it);
    });
    bd2.appendChild(il);

    right.appendChild(bd2);

    grid.appendChild(left);
    grid.appendChild(right);
    wrap.appendChild(grid);
    return wrap;
  },

  favorites({items, onOpen, onClear}){
    const wrap = el("div",{class:"main"});
    const card = el("div",{class:"card"});
    card.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Favoritos"}),
        el("p",{html:"Seus blueprints salvos para acesso rápido (local)."})
      ]),
      el("button",{class:"btn danger", onclick:onClear},[el("span",{html:"Limpar"})])
    ]));
    const bd = el("div",{class:"bd"});
    if(items.length===0){
      bd.appendChild(el("p",{style:"color:var(--muted);margin:0", html:"Nenhum favorito ainda. Abra um blueprint e toque em ⭐."}));
    }else{
      const list = el("div",{class:"list"});
      items.forEach(f=>{
        const it = el("div",{class:"item", onclick: ()=> onOpen(f)});
        it.appendChild(el("div",{class:"meta"},[
          el("strong",{html:`${f.genreName} — ${f.instrumentName}`}),
          el("span",{html:`Nível: ${f.level||"intermediate"}`})
        ]));
        it.appendChild(el("span",{class:"badge", html:"Abrir"}));
        list.appendChild(it);
      });
      bd.appendChild(list);
    }
    card.appendChild(bd);
    wrap.appendChild(card);
    return wrap;
  },

  browse({genres, instruments, selection, onSelectGenre, onSelectInstrument}){
    const wrap = el("div",{class:"main"});
    const grid = el("div",{class:"grid two"});

    const gcard = el("div",{class:"card"});
    gcard.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"1) Escolha o gênero"}),
        el("p",{html:"A identidade e recomendações adaptam conforme o estilo."})
      ]),
      el("span",{class:"badge", html:"Gênero"})
    ]));
    const gbd = el("div",{class:"bd"});
    const gl = el("div",{class:"list"});
    genres.forEach(g=>{
      const it = el("div",{class:"item", onclick: ()=> onSelectGenre(g.id)});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:g.name}),
        el("span",{html:g.id===selection.genreId? "Selecionado" : "Toque para selecionar"})
      ]));
      it.appendChild(el("span",{class:"badge", html:g.id===selection.genreId? "Ativo":"Selecionar"}));
      gl.appendChild(it);
    });
    gbd.appendChild(gl);
    gcard.appendChild(gbd);

    const icard = el("div",{class:"card"});
    icard.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"2) Escolha o instrumento / bus"}),
        el("p",{html:"Blueprints de mix por instrumento e modos de masterização."})
      ]),
      el("span",{class:"badge", html:"Instrumento"})
    ]));
    const ibd = el("div",{class:"bd"});
    const il = el("div",{class:"list"});
    instruments.forEach(i=>{
      const it = el("div",{class:"item", onclick: ()=> onSelectInstrument(i.id)});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:`${iconGlyph(i.icon)} ${i.name}`}),
        el("span",{html:(i.quickTags||[]).join(" • ") || "Blueprint"})
      ]));
      it.appendChild(el("span",{class:"badge", html: i.id==="master" ? "Abrir" : "Selecionar"}));
      il.appendChild(it);
    });
    ibd.appendChild(il);
    icard.appendChild(ibd);

    grid.appendChild(gcard);
    grid.appendChild(icard);
    wrap.appendChild(grid);
    return wrap;
  },

  master({genre, modes, onBack, onUnlock}){
    const wrap = el("div",{class:"main"});
    const card = el("div",{class:"card"});
    card.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:`Masterização — ${genre?.name || ""}`}),
        el("p",{html:"Modos de master com alvos e riscos. (Paywall pronto para integração futura.)"})
      ]),
      el("button",{class:"btn", onclick:onBack},[el("span",{html:"Voltar"})])
    ]));
    const bd = el("div",{class:"bd"});

    const list = el("div",{class:"list"});
    modes.forEach(m=>{
      const it = el("div",{class:"item"});
      const left = el("div",{class:"meta"});
      left.appendChild(el("strong",{html:m.title}));
      left.appendChild(el("span",{html:m.summary}));
      it.appendChild(left);

      if(m.premium){
        const b = el("button",{class:"btn primary", onclick:onUnlock});
        b.textContent = m.paywall.cta || "Desbloquear";
        it.appendChild(b);
      }else{
        it.appendChild(el("span",{class:"badge", html:"Core"}));
      }
      list.appendChild(it);

      // details
      const detail = el("div",{class:"step", style:"margin-top:8px"});
      detail.appendChild(el("div",{class:"cap"},[
        el("strong",{html:"Cadeia"}),
        el("span",{class:"t", html:m.tier==="core"?"CORE":"PREMIUM"})
      ]));
      const steps = (m.chain||[]).map((s,idx)=> `${idx+1}. ${s.name} — ${s.why}`).join("<br/>");
      detail.appendChild(el("p",{class:"why", html:steps}));
      detail.appendChild(el("div",{class:"div"}));
      const tg = m.targets || {};
      detail.appendChild(el("p",{html:`<span style="color:var(--muted)">Targets:</span> LUFS‑I ${tg.lufs_i?.min}..${tg.lufs_i?.max} ${tg.lufs_i?.unit||""} • TP ${tg.tp?.min}..${tg.tp?.max} ${tg.tp?.unit||""}`}));
      const risks = (m.risks||[]).map(r=> `• <b>${r.label}:</b> ${r.hint}`).join("<br/>");
      if(risks) detail.appendChild(el("p",{class:"note", html:risks}));
      list.appendChild(detail);
    });

    bd.appendChild(list);
    card.appendChild(bd);
    wrap.appendChild(card);
    return wrap;
  },

  blueprint({genre, instrument, blueprint, level, decisions, meters, resolvedChain, onBack, onSetLevel, onDecision, onCopy, onDownload, onFavorite, isFavorite}){
    const wrap = el("div",{class:"main"});
    const grid = el("div",{class:"grid two"});

    const left = el("div",{class:"card accent"});
    left.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:`${genre?.name || "—"} • ${instrument?.name || "—"}`}),
        el("p",{html: blueprint?.summary || "Blueprint não encontrado — exibindo fallback."})
      ]),
      el("button",{class:"btn", onclick:onBack},[el("span",{html:"Voltar"})])
    ]));
    const bd = el("div",{class:"bd"});

    // level switch
    bd.appendChild(sectionTitle("Nível"));
    const seg = el("div",{class:"seg"});
    for(const opt of ["beginner","intermediate","advanced"]){
      const b = el("button",{ "aria-pressed": String(level===opt), onclick: ()=> onSetLevel(opt) });
      b.textContent = opt==="beginner"?"Iniciante": opt==="intermediate"?"Intermediário":"Avançado";
      seg.appendChild(b);
    }
    bd.appendChild(seg);

    bd.appendChild(el("div",{class:"div"}));
    bd.appendChild(sectionTitle("Decisões (interativo)"));
    const decWrap = el("div",{class:"col"});
    for(const d of (blueprint?.decisions||[])){
      if(d.type==="segmented"){
        const box = el("div",{class:"slider"});
        box.appendChild(el("div",{class:"top"},[
          el("strong",{html:d.label}),
          el("span",{html:`Selecionado: <b style="color:var(--accent2)">${(d.options.find(o=>o.id===decisions[d.id])||{}).label||""}</b>`})
        ]));
        const s = el("div",{class:"seg"});
        for(const o of d.options){
          const b = el("button",{ "aria-pressed": String(decisions[d.id]===o.id), onclick: ()=> onDecision(d.id, o.id) });
          b.textContent = o.label;
          s.appendChild(b);
        }
        box.appendChild(s);
        decWrap.appendChild(box);
      }
      if(d.type==="slider"){
        const box = el("div",{class:"slider"});
        box.appendChild(el("div",{class:"top"},[
          el("strong",{html:d.label}),
          el("span",{html:`${decisions[d.id]}`})
        ]));
        const input = el("input",{type:"range", min:String(d.min), max:String(d.max), value:String(decisions[d.id] ?? d.default)});
        input.addEventListener("input", ()=> onDecision(d.id, Number(input.value)));
        box.appendChild(input);
        const marks = el("div",{class:"marks"});
        (d.marks||[]).forEach(m=> marks.appendChild(el("span",{html:m.t})));
        box.appendChild(marks);
        decWrap.appendChild(box);
      }
    }
    bd.appendChild(decWrap);

    bd.appendChild(el("div",{class:"div"}));
    bd.appendChild(sectionTitle("Ações"));
    bd.appendChild(el("div",{class:"row"},[
      el("button",{class:"btn primary", onclick:onCopy},[el("span",{html:"Copiar cadeia"})]),
      el("button",{class:"btn", onclick:onDownload},[el("span",{html:"Baixar TXT"})]),
      el("button",{class:"btn", onclick:onFavorite},[el("span",{html: isFavorite? "⭐ Favorito":"☆ Favoritar"})])
    ]));

    left.appendChild(bd);

    const right = el("div",{class:"card"});
    right.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html: blueprint?.title || "Blueprint"}),
        el("p",{html:"Cadeia visual + alvos de medição (guia)."})
      ]),
      el("span",{class:"badge", html:"AAA UI"})
    ]));
    const bd2 = el("div",{class:"bd"});
    bd2.appendChild(sectionTitle("Medições (guia)"));
    const metersEl = el("div",{class:"meters"});
    for(const k of Object.keys(meters||{})){
      const m = meters[k];
      const box = el("div",{class:"meter"});
      box.appendChild(el("div",{class:"lbl", html:m.label}));
      const val = (m.unit==="LUFS") ? m.value.toFixed(1) : (m.unit? m.value.toFixed(2): Math.round(m.value).toString());
      box.appendChild(el("div",{class:"val", html:`<b>${val}</b> <span style="color:var(--muted)">${m.unit||""}</span>`}));
      const bar = el("div",{class:"bar"});
      const fill = el("i",{style:`width:${Math.round(m.pct*100)}%`});
      bar.appendChild(fill);
      box.appendChild(bar);
      metersEl.appendChild(box);
    }
    bd2.appendChild(metersEl);

    bd2.appendChild(el("div",{class:"div"}));
    bd2.appendChild(sectionTitle("Cadeia (horizontal)"));
    const chain = el("div",{class:"chain"});
    (resolvedChain||[]).forEach((s,idx)=>{
      const st = el("div",{class:"step"});
      st.appendChild(el("div",{class:"cap"},[
        el("strong",{html:`${idx+1}. ${s.name}`}),
        el("span",{class:"t", html:(s.type||"stage").toUpperCase()})
      ]));
      st.appendChild(el("p",{class:"why", html:`<b>Por quê:</b> ${s.why || "—"}`}));
      if(s.note) st.appendChild(el("p",{class:"note", html:`⚠️ ${s.note}`}));
      st.appendChild(el("div",{class:"lvl"},[
        el("div",{class:"lbl", html:"Recomendação do nível"}),
        el("div",{class:"txt", html: (s.settingsByLevel?.[level]?.text || s.settingsByLevel?.intermediate?.text || "—")})
      ]));
      chain.appendChild(st);
    });
    bd2.appendChild(chain);

    bd2.appendChild(el("div",{class:"div"}));
    bd2.appendChild(el("p",{style:"margin:0;color:var(--muted);font-size:12px;line-height:1.45", html:"Observação: os meters são guias educacionais e profissionais (não medem áudio real). Ideal para orientar decisões, consistência e validação."}));

    right.appendChild(bd2);

    grid.appendChild(left);
    grid.appendChild(right);
    wrap.appendChild(grid);
    return wrap;
  },

,
  upgrade(){
  const wrap = el("div",{class:"main"});
  const card = el("div",{class:"card accent"});
  card.appendChild(el("div",{class:"hd"},[
    el("div",{},[
      el("h2",{html:"Desbloqueie recursos profissionais"}),
      el("p",{html:"DLCs adicionam cadeias avançadas, decisões críticas e masterização profissional."})
    ]),
    el("span",{class:"badge", html:"Upgrade"})
  ]));
  const bd = el("div",{class:"bd"});
  const list = el("div",{class:"list"});
  [
    {t:"Vocal Pro Pack",d:"Cadeias vocais avançadas por gênero e voz."},
    {t:"Master Pro Pack",d:"Masterização streaming, club e dinâmica."}
  ].forEach(x=>{
    const it = el("div",{class:"item"});
    it.appendChild(el("div",{class:"meta"},[el("strong",{html:x.t}),el("span",{html:x.d})]));
    it.appendChild(el("button",{class:"btn primary", onclick:()=>alert("Checkout futuro")},[el("span",{html:"Desbloquear"})]));
    list.appendChild(it);
  });
  bd.appendChild(list);
  card.appendChild(bd);
  wrap.appendChild(card);
  return wrap;
}

  footer(){
    const f = el("div",{class:"footer"});
    f.innerHTML = `Blueprints interativos • DLC-ready • Mobile-first • Vanilla JS • <a href="./README.md" target="_blank" rel="noreferrer">README</a>`;
    return f;
  }
};

function info(title, desc){
  const it = el("div",{class:"item"});
  it.appendChild(el("div",{class:"meta"},[
    el("strong",{html:title}),
    el("span",{html:desc})
  ]));
  it.appendChild(el("span",{class:"badge", html:"OK"}));
  return it;
}


