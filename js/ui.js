// ui.js — versão estável (sem tela preta)

function el(tag, props={}, children=[]){
  const e = document.createElement(tag);
  for(const [k,v] of Object.entries(props)){
    if(k==="class") e.className=v;
    else if(k==="html") e.innerHTML=v;
    else if(k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k,v);
  }
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(typeof c==="string") e.appendChild(document.createTextNode(c));
    else if(c) e.appendChild(c);
  });
  return e;
}

export const ui = {

  topbar({onNav,current,accentName}){
    const bar = el("header",{class:"topbar"});
    bar.appendChild(el("div",{class:"brand"},["MixBlueprint Pro"]));
    bar.appendChild(el("div",{class:"accent"},[accentName||"—"]));
    const nav = el("nav",{class:"nav"});
    [
      ["Home","#/"],
      ["Explorar","#/browse"],
      ["Favoritos","#/favorites"],
      ["Upgrade","#/upgrade"]
    ].forEach(([t,h])=>{
      nav.appendChild(el("a",{href:h,class:current===h.replace("#/","")?"active":""},[t]));
    });
    bar.appendChild(nav);
    return bar;
  },

  home({onBrowse,onFavorites}){
    return el("div",{class:"main"},[
      el("h1",{},"Mix & Master profissional"),
      el("p",{},"Blueprints interativos para decisões reais de áudio."),
      el("div",{class:"actions"},[
        el("button",{class:"btn primary",onclick:onBrowse},"Explorar"),
        el("button",{class:"btn ghost",onclick:onFavorites},"Favoritos")
      ])
    ]);
  },

  browse({genres,instruments,onSelectGenre,onSelectInstrument}){
    return el("div",{class:"main"},[
      el("h2",{},"Gêneros"),
      el("div",{class:"grid"},genres.map(g=>
        el("button",{class:"card",onclick:()=>onSelectGenre(g.id)},g.name)
      )),
      el("h2",{},"Instrumentos"),
      el("div",{class:"grid"},instruments.map(i=>
        el("button",{class:"card",onclick:()=>onSelectInstrument(i.id)},i.name)
      ))
    ]);
  },

  favorites({items,onOpen,onClear}){
    return el("div",{class:"main"},[
      el("h2",{},"Favoritos"),
      el("button",{class:"btn ghost",onclick:onClear},"Limpar"),
      ...items.map(i=>
        el("div",{class:"card",onclick:()=>onOpen(i)},
          `${i.genreName} · ${i.instrumentName}`)
      )
    ]);
  },

  blueprint({blueprint,resolvedChain,onCopy,onDownload,onFavorite,isFavorite}){
    return el("div",{class:"main"},[
      el("h2",{},blueprint.title),
      el("ol",{},resolvedChain.map(s=>el("li",{},s.name))),
      el("div",{class:"actions"},[
        el("button",{class:"btn",onclick:onCopy},"Copiar"),
        el("button",{class:"btn",onclick:onDownload},"TXT"),
        el("button",{class:"btn ghost",onclick:onFavorite},
          isFavorite?"★ Favorito":"☆ Favoritar")
      ])
    ]);
  },

  master({modes,onUnlock}){
    return el("div",{class:"main"},[
      el("h2",{},"Masterização"),
      ...modes.map(m=>
        el("div",{class:"card"},[
          el("strong",{},m.name),
          m.premium
            ? el("button",{class:"btn primary",onclick:onUnlock},"Desbloquear")
            : el("span",{},"Disponível")
        ])
      )
    ]);
  },

  upgrade(){
    return el("div",{class:"main"},[
      el("h2",{},"Upgrade Profissional"),
      el("p",{},"Desbloqueie DLCs avançados de Mix e Master."),
      el("button",{class:"btn primary"},"Comprar DLC")
    ]);
  },

  footer(){
    return el("footer",{class:"footer"},"© Vale Games");
  }
};