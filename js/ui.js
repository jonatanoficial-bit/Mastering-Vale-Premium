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

    const brand = el("div",{class:"brand", onclick:()=> onNav("#/")},[
      el("img",{src:"./assets/logo.png", alt:"Logo"}),
      el("div",{class:"title"},[
        el("strong",{html:"MixBlueprint Pro"}),
        el("span",{html:`Modo: <b style="color:var(--accent2)">${accentName||"—"}</b>`})
      ])
    ]);

    const pills = el("div",{class:"pills"});
    const nav = [
      {id:"browse", label:"Explorar", hash:"#/browse"},
      {id:"favorites", label:"Favoritos", hash:"#/favorites"},
      {id:"upgrade", label:"Upgrade", hash:"#/upgrade"},
      {id:"admin", label:"Admin", hash:"#/admin"}
    ];
    nav.forEach(x=>{
      const a = el("a",{class:"pill", href:x.hash, onclick:(e)=>{ e.preventDefault(); onNav(x.hash); }});
      a.textContent = x.label;
      pills.appendChild(a);
    });

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
        el("p",{html:"Selecione gênero e instrumento, responda decisões reais e receba cadeias detalhadas + alvos de medição. Feito para mobile, pronto pra mercado."})
      ]),
      el("span",{class:"badge", html:"v2 — interativo"})
    ]));
    const bd = el("div",{class:"bd"});
    bd.appendChild(el("div",{class:"row"},[
      el("button",{class:"btn primary", onclick:onBrowse},[el("span",{html:"Começar"})]),
      el("button",{class:"btn", onclick:onFavorites},[el("span",{html:`Favoritos (${store.getFavorites().length})`})]),
      el("button",{class:"btn ghost", onclick:()=> location.hash = "#/master"},[el("span",{html:"Masterização"})])
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
      el("span",{class:"badge", html:"Mobile-first"})
    ]));
    const bd2 = el("div",{class:"bd"});
    bd2.appendChild(sectionTitle("Gêneros disponíveis"));
    const gl = el("div",{class:"list"});
    (genres||[]).forEach(g=>{
      const it = el("div",{class:"item", onclick:()=> location.hash = `#/browse?g=${g.id}`});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:g.name}),
        el("span",{html:"Blueprints + Master modes"})
      ]));
      it.appendChild(el("button",{class:"btn", onclick:(e)=>{ e.stopPropagation(); location.hash=`#/browse?g=${g.id}`; }},[
        el("span",{html:"Selecionar"})
      ]));
      gl.appendChild(it);
    });
    bd2.appendChild(gl);

    right.appendChild(bd2);

    grid.appendChild(left);
    grid.appendChild(right);
    wrap.appendChild(grid);
    return wrap;
  },

  browse({genres, instruments, selection, onSelectGenre, onSelectInstrument}){
    const wrap = el("div",{class:"main"});
    const grid = el("div",{class:"grid two"});

    const left = el("div",{class:"card accent"});
    left.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Explorar"}),
        el("p",{html:"Escolha o gênero e o instrumento para abrir a cadeia detalhada."})
      ]),
      el("span",{class:"badge", html:"v2"})
    ]));
    const bd = el("div",{class:"bd"});
    bd.appendChild(sectionTitle("Gêneros"));
    const gList = el("div",{class:"list"});
    (genres||[]).forEach(g=>{
      const it = el("div",{class:"item", onclick:()=> onSelectGenre(g.id)});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:g.name}),
        el("span",{html:g.tagline || "Blueprints profissionais"})
      ]));
      it.appendChild(el("span",{class:"badge", html:(selection.genreId===g.id)?"OK":"Selecionar"}));
      gList.appendChild(it);
    });
    bd.appendChild(gList);
    left.appendChild(bd);

    const right = el("div",{class:"card"});
    right.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Instrumentos / Bus"}),
        el("p",{html:"Escolha um item para abrir o blueprint."})
      ]),
      el("span",{class:"badge", html:"AAA UI"})
    ]));
    const bd2 = el("div",{class:"bd"});
    bd2.appendChild(sectionTitle("Selecione"));
    const iList = el("div",{class:"list"});
    (instruments||[]).forEach(ins=>{
      const it = el("div",{class:"item", onclick:()=> onSelectInstrument(ins.id)});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:`${iconGlyph(ins.kind)} ${ins.name}`}),
        el("span",{html:ins.desc || "Chain + targets"})
      ]));
      it.appendChild(el("button",{class:"btn", onclick:(e)=>{ e.stopPropagation(); onSelectInstrument(ins.id);} },[
        el("span",{html:"Abrir"})
      ]));
      iList.appendChild(it);
    });
    iList.appendChild(el("div",{class:"item", onclick:()=> onSelectInstrument("master")},[
      el("div",{class:"meta"},[
        el("strong",{html:"💿 Masterização (modos)"}),
        el("span",{html:"Básico → Avançado"})
      ]),
      el("button",{class:"btn primary", onclick:(e)=>{ e.stopPropagation(); onSelectInstrument("master"); }},[
        el("span",{html:"Abrir"})
      ])
    ]));
    bd2.appendChild(iList);
    right.appendChild(bd2);

    grid.appendChild(left);
    grid.appendChild(right);
    wrap.appendChild(grid);
    return wrap;
  },

  favorites({items, onOpen, onClear}){
    const wrap = el("div",{class:"main"});
    const card = el("div",{class:"card accent"});
    card.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Favoritos"}),
        el("p",{html:"Acesse rapidamente seus blueprints mais usados."})
      ]),
      el("button",{class:"btn danger", onclick:onClear},[el("span",{html:"Limpar"})])
    ]));
    const bd = el("div",{class:"bd"});
    if(!items?.length){
      bd.appendChild(el("p",{style:"margin:0;color:var(--muted)", html:"Ainda não há favoritos. Abra um blueprint e toque em Favoritar."}));
    } else {
      const list = el("div",{class:"list"});
      items.forEach(it=>{
        const row = el("div",{class:"item", onclick:()=> onOpen(it)});
        row.appendChild(el("div",{class:"meta"},[
          el("strong",{html:`${it.genreName} • ${it.instrumentName}`}),
          el("span",{html:`Nível: ${it.level || "intermediate"}`})
        ]));
        row.appendChild(el("button",{class:"btn", onclick:(e)=>{ e.stopPropagation(); onOpen(it); }},[
          el("span",{html:"Abrir"})
        ]));
        list.appendChild(row);
      });
      bd.appendChild(list);
    }
    card.appendChild(bd);
    wrap.appendChild(card);
    return wrap;
  },

  master({genre, modes, onBack, onUnlock}){
    const wrap = el("div",{class:"main"});
    const card = el("div",{class:"card accent"});
    card.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:`Masterização • ${genre?.name || "—"}`}),
        el("p",{html:"Modos de masterização do básico ao avançado. Pronto para monetização por upgrade/DLC."})
      ]),
      el("button",{class:"btn", onclick:onBack},[el("span",{html:"Voltar"})])
    ]));
    const bd = el("div",{class:"bd"});
    const list = el("div",{class:"list"});
    (modes||[]).forEach(m=>{
      const it = el("div",{class:"item"});
      it.appendChild(el("div",{class:"meta"},[
        el("strong",{html:m.name}),
        el("span",{html:m.desc})
      ]));
      it.appendChild(el("button",{class:"btn primary", onclick:onUnlock},[el("span",{html:"Desbloquear"})]));
      list.appendChild(it);
    });
    bd.appendChild(list);
    card.appendChild(bd);
    wrap.appendChild(card);
    return wrap;
  },

  upgrade(){
    const wrap = el("div",{class:"main"});
    const card = el("div",{class:"card accent"});
    card.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Upgrade"}),
        el("p",{html:"Desbloqueie packs premium, masters avançados e DLCs por gênero. (Placeholder pronto para checkout)"} )
      ]),
      el("span",{class:"badge", html:"Paywall-ready"})
    ]));
    const bd = el("div",{class:"bd"});
    bd.appendChild(sectionTitle("Planos sugeridos"));
    const list = el("div",{class:"list"});
    [
      {t:"Starter Pro", d:"Blueprints básicos + targets por gênero."},
      {t:"Mix Pro", d:"Cadeias completas por instrumento + variações."},
      {t:"Master Pro", d:"Masterização avançada com múltiplos plugins."}
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
  },

  blueprint({genre, instrument, blueprint, level, decisions, meters, resolvedChain, insights=[], onBack, onSetLevel, onDecision, onCopy, onDownload, onFavorite, isFavorite}){
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
      el("button",{class:"btn ghost", onclick:onFavorite},[el("span",{html: isFavorite ? "★ Favorito" : "☆ Favoritar"})]),
    ]));

    left.appendChild(bd);

    const right = el("div",{class:"card"});
    right.appendChild(el("div",{class:"hd"},[
      el("div",{},[
        el("h2",{html:"Medições + Cadeia"}),
        el("p",{html:"Targets e recomendações exibidos conforme suas decisões (engine feel)."})
      ]),
      el("span",{class:"badge", html:"AAA UI"})
    ]));

    const bd2 = el("div",{class:"bd"});

    // insights (engine feel)
    if((insights||[]).length){
      bd2.appendChild(sectionTitle("Insights (engine)"));
      const box = el("div",{class:"insights"});
      (insights||[]).slice(0,5).forEach(t=>{
        const li = el("div",{class:"ins"},[
          el("span",{class:"dot"}),
          el("div",{class:"txt", html:t})
        ]);
        box.appendChild(li);
      });
      bd2.appendChild(box);
      bd2.appendChild(el("div",{class:"div"}));
    }

    bd2.appendChild(sectionTitle("Medições (guia)"));
    const metersEl = el("div",{class:"meters"});
    for(const k of Object.keys(meters||{})){
      const m = meters[k];
      const box = el("div",{class:"meter"});
      box.appendChild(el("div",{class:"lbl", html:m.label}));
      const val = (m.unit==="LUFS") ? m.value.toFixed(1) : (m.unit? m.value.toFixed(2): Math.round(m.value).toString());
      box.appendChild(el("div",{class:"val", html:`<b>${val}</b> <span style="color:var(--muted)">${m.unit||""}</span>`}));
      const bar = el("div",{class:"bar"});
      const fill = el("i",{class:"fill", style:"width:0%", "data-w": String(Math.round(m.pct*100))});
      bar.appendChild(fill);
      box.appendChild(bar);
      metersEl.appendChild(box);
    }
    bd2.appendChild(metersEl);

    bd2.appendChild(el("div",{class:"div"}));
    bd2.appendChild(sectionTitle("Cadeia (horizontal)"));
    const chain = el("div",{class:"chain"});
    (resolvedChain||[]).forEach((s,idx)=>{
      const st = el("div",{class:"step", style:`--i:${idx}`});
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
