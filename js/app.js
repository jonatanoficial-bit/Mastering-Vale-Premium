import { ContentHub } from "./content.js";
import { ui } from "./ui.js";
import { Store } from "./store.js";
import { DecisionEngine } from "./engine.js";

const state = {
  hub: null,
  store: new Store("mixblueprint_pro_v2"),
  view: "home",
  selection: {
    genreId: null,
    instrumentId: null,
    level: "intermediate",
  },
  activeBlueprint: null,
  decisions: {},
};

function setAccentByGenre(genre) {
  const root = document.documentElement;
  const accent = genre?.accent ?? "#B7A7FF";
  const mix = genre?.stageAccent?.mix ?? "#9CF0FF";
  const master = genre?.stageAccent?.master ?? "#FFB3E1";
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent2", mix);
  root.style.setProperty("--accent3", master);
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1700);
}

function navTo(path) {
  // se já estiver no mesmo hash, força re-render (mobile às vezes não dispara hashchange)
  if (location.hash === path) {
    route();
  } else {
    location.hash = path;
  }
}

function route() {
  // ✅ CORREÇÃO: separar path e query corretamente
  const raw = (location.hash || "#/").slice(1); // remove '#'
  const [pathPart, queryPart = ""] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const page = parts[0] || "";

  if (page === "") state.view = "home";
  else if (page === "browse") state.view = "browse";
  else if (page === "blueprint") state.view = "blueprint";
  else if (page === "master") state.view = "master";
  else if (page === "favorites") state.view = "favorites";
  else if (page === "upgrade") state.view = "upgrade";
  else state.view = "home";

  const params = new URLSearchParams(queryPart);
  const genreId = params.get("g");
  const instrumentId = params.get("i");
  const level = params.get("l");

  if (genreId) state.selection.genreId = genreId;
  if (instrumentId) state.selection.instrumentId = instrumentId;
  if (level) state.selection.level = level;

  render();
}

function buildCopyText({ genre, instrument, level, blueprint, decisions, chain, meterTargets }) {
  const template = blueprint.copyTemplate;
  const title = template.title
    .replace("{genre}", genre.name)
    .replace("{instrument}", instrument.name)
    .replace("{level}", levelLabel(level));

  const lines = template.lines.map((line) => {
    return line
      .replace("{voiceType}", decisions.voiceType ?? "-")
      .replace("{vibe}", decisions.vibe ?? "-")
      .replace("{arrangement}", decisions.arrangement ?? "-")
      .replace("{air}", String(decisions.air ?? "-"))
      .replace(
        "{steps}",
        chain
          .map((s, idx) => `${idx + 1}. ${s.name}${s.note ? ` — Nota: ${s.note}` : ""}`)
          .join("\n")
      )
      .replace("{lufs_s_range}", rangeStr(meterTargets.lufs_s))
      .replace("{tp_range}", rangeStr(meterTargets.tp))
      .replace("{gr_range}", rangeStr(meterTargets.gr));
  });
  return `${title}\n\n${lines.join("\n")}`.trim();
}

function rangeStr(t) {
  if (!t) return "-";
  const min = (t.min ?? "").toString();
  const max = (t.max ?? "").toString();
  return `${min}..${max} ${t.unit || ""}`.trim();
}

function levelLabel(lvl) {
  const map = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };
  return map[lvl] || lvl;
}

function computeMeters(blueprint, decisions) {
  const base = {};
  for (const [k, t] of Object.entries(blueprint.targets || {})) {
    const mid = (t.min + t.max) / 2;
    base[k] = { ...t, value: mid };
  }

  const eng = new DecisionEngine(blueprint);
  const res = eng.resolve(decisions);
  const bias = res.meterBias || {};

  if (typeof decisions.air === "number" && blueprint.targets?.dyn) {
    const a = decisions.air;
    bias.dyn = (bias.dyn || 0) + (a - 50) * -0.08;
  }

  for (const [k, delta] of Object.entries(bias)) {
    if (base[k]) base[k].value = base[k].value + delta;
  }

  const out = {};
  for (const [k, m] of Object.entries(base)) {
    const v = Math.max(m.min, Math.min(m.max, m.value));
    const pct = (v - m.min) / (m.max - m.min + 1e-9);
    out[k] = { ...m, value: v, pct };
  }
  return out;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function render() {
  const hub = state.hub;
  const root = document.getElementById("root");
  if (!hub || !root) return;

  const genres = hub.getGenres();
  const instruments = hub.getInstruments();

  const currentGenre = genres.find((g) => g.id === state.selection.genreId) || genres[0];
  if (!state.selection.genreId && currentGenre) state.selection.genreId = currentGenre.id;

  setAccentByGenre(currentGenre);

  const header = ui.topbar({
    onNav: navTo,
    current: state.view,
    accentName: currentGenre?.name || "—",
  });

  let body = null;

  if (state.view === "home") {
    body = ui.home({
      genres,
      instruments,
      store: state.store,
      onBrowse: () => navTo(`#/browse?g=${state.selection.genreId}`),
      onFavorites: () => navTo(`#/favorites`),
    });
  }

  if (state.view === "upgrade") {
    body = ui.upgrade();
  }

  if (state.view === "favorites") {
    const favs = state.store.getFavorites();
    const cards = favs.map((f) => {
      const g = genres.find((x) => x.id === f.genreId);
      const i = instruments.find((x) => x.id === f.instrumentId);
      return { ...f, genreName: g?.name || f.genreId, instrumentName: i?.name || f.instrumentId };
    });

    body = ui.favorites({
      items: cards,
      onOpen: (f) => navTo(`#/blueprint?g=${f.genreId}&i=${f.instrumentId}&l=${f.level || "intermediate"}`),
      onClear: () => {
        state.store.clearFavorites();
        toast("Favoritos limpos");
        render();
      },
    });
  }

  if (state.view === "browse") {
    body = ui.browse({
      genres,
      instruments,
      selection: state.selection,
      onSelectGenre: (id) => {
        state.selection.genreId = id;
        navTo(`#/browse?g=${id}`);
      },
      onSelectInstrument: (id) => {
        state.selection.instrumentId = id;
        if (id === "master") {
          navTo(`#/master?g=${state.selection.genreId}`);
        } else {
          navTo(`#/blueprint?g=${state.selection.genreId}&i=${id}&l=${state.selection.level}`);
        }
      },
    });
  }

  if (state.view === "master") {
    const masters = hub.getMasterModes();
    body = ui.master({
      genre: currentGenre,
      modes: masters,
      onBack: () => navTo(`#/browse?g=${state.selection.genreId}`),
      onUnlock: () => toast("Paywall (placeholder): pronto para integrar checkout"),
    });
  }

  if (state.view === "blueprint") {
    const blueprint =
      hub.findBlueprint(state.selection.genreId, state.selection.instrumentId) ||
      hub.fallbackBlueprint(state.selection.instrumentId);

    state.activeBlueprint = blueprint;
    const instrument = instruments.find((i) => i.id === state.selection.instrumentId) || instruments[0];

    if (blueprint) {
      const d = {};
      for (const dec of blueprint.decisions || []) {
        d[dec.id] = state.decisions[dec.id] ?? dec.default;
      }
      state.decisions = d;
    }

    const engine = new DecisionEngine(blueprint);
    const resolved = engine.resolve(state.decisions);
    const chain = resolved.chain;
    const meters = computeMeters(blueprint, state.decisions);

    body = ui.blueprint({
      genre: currentGenre,
      instrument,
      blueprint,
      level: state.selection.level,
      decisions: state.decisions,
      meters,
      resolvedChain: chain,
      onBack: () => navTo(`#/browse?g=${state.selection.genreId}`),
      onSetLevel: (lvl) => {
        state.selection.level = lvl;
        navTo(`#/blueprint?g=${state.selection.genreId}&i=${state.selection.instrumentId}&l=${lvl}`);
      },
      onDecision: (id, value) => {
        state.decisions[id] = value;
        render();
      },
      onCopy: async () => {
        const text = buildCopyText({
          genre: currentGenre,
          instrument,
          level: state.selection.level,
          blueprint,
          decisions: state.decisions,
          chain,
          meterTargets: blueprint.targets || {},
        });
        const ok = await copyToClipboard(text);
        toast(ok ? "Cadeia copiada" : "Falha ao copiar");
      },
      onDownload: () => {
        const text = buildCopyText({
          genre: currentGenre,
          instrument,
          level: state.selection.level,
          blueprint,
          decisions: state.decisions,
          chain,
          meterTargets: blueprint.targets || {},
        });
        const safe = `${currentGenre.name}_${instrument.name}_${levelLabel(state.selection.level)}`.replace(/[^\w\-]+/g, "_");
        downloadText(`${safe}.txt`, text);
        toast("TXT gerado");
      },
      onFavorite: () => {
        state.store.toggleFavorite({
          genreId: currentGenre.id,
          instrumentId: instrument.id,
          level: state.selection.level,
        });
        toast(
          state.store.isFavorite(currentGenre.id, instrument.id, state.selection.level)
            ? "Adicionado aos favoritos"
            : "Removido dos favoritos"
        );
        render();
      },
      isFavorite: state.store.isFavorite(currentGenre.id, instrument.id, state.selection.level),
    });
  }

  root.innerHTML = "";
  root.appendChild(header);
  root.appendChild(body);
  root.appendChild(ui.footer());
}

async function init() {
  state.hub = new ContentHub(state.store);
  await state.hub.init();

  const genres = state.hub.getGenres();
  if (!state.selection.genreId) state.selection.genreId = genres[0]?.id || null;

  window.addEventListener("hashchange", route);

  // ✅ SW desativado temporariamente (evita cache quebrado)
  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    } catch {}
  }

  route();
}

init();
