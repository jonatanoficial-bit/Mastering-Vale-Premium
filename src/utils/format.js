import { h } from "./dom.js";

export function formatRange(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  if(Array.isArray(obj)) return obj.join(" • ");
  return String(obj);
}

export function chainToText({genre, instrument, levelLabel, chain, guide}){
  const lines = [];
  lines.push(`MixBlueprint — Cadeia (${instrument?.name || ""})`);
  if(genre) lines.push(`Gênero: ${genre.name}`);
  lines.push(`Nível: ${levelLabel}`);
  lines.push("");
  if(chain?.goal) lines.push(`Objetivo: ${chain.goal}`);
  lines.push("");

  if(chain?.targets){
    lines.push("Targets (ponto de partida):");
    for(const [k,v] of Object.entries(chain.targets)){
      lines.push(`- ${k}: ${v}`);
    }
    lines.push("");
  }

  if(guide?.focus?.length){
    lines.push("Foco do gênero:");
    for(const f of guide.focus) lines.push(`- ${f}`);
    lines.push("");
  }

  lines.push("Passos:");
  (chain?.steps || []).forEach((s, i) => {
    lines.push(`${i+1}. [${s.type}] ${s.title}`);
    if(s.purpose) lines.push(`   - Por quê: ${s.purpose}`);
    if(s.settings?.length){
      lines.push(`   - Ajustes:`);
      for(const row of s.settings){
        const note = row.note ? ` (${row.note})` : "";
        lines.push(`     • ${row.label}: ${row.value}${note}`);
      }
    }
    if(s.pluginExamples?.length){
      lines.push(`   - Plugins (exemplos): ${s.pluginExamples.join(", ")}`);
    }
    if(s.tips?.length){
      lines.push(`   - Dicas:`);
      for(const t of s.tips) lines.push(`     • ${t}`);
    }
  });

  if(chain?.auxSends?.length){
    lines.push("");
    lines.push("Aux / Sends:");
    for(const a of chain.auxSends){
      lines.push(`- ${a.title}: ${a.purpose || ""}`);
      (a.settings || []).forEach(row => {
        const note = row.note ? ` (${row.note})` : "";
        lines.push(`  • ${row.label}: ${row.value}${note}`);
      });
    }
  }

  if(chain?.notes?.length){
    lines.push("");
    lines.push("Notas:");
    for(const n of chain.notes) lines.push(`- ${n}`);
  }

  return lines.join("\n");
}

export function levelLabel(level){
  return ({
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  })[level] || level;
}

export function fileSafeName(str){
  return String(str || "mixblueprint")
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function badgeKeyLabel(key){
  const map = {
    track_peak_dbfs: "Picos (track)",
    bus_peak_dbfs: "Picos (bus)",
    premaster_peaks: "Picos (premaster)",
    true_peak: "True Peak",
    target_lufs: "LUFS (alvo)",
    streaming_lufs_i: "LUFS (streaming)",
    comp_gr: "GR (comp)",
    glue_gr: "GR (glue)",
    deess_gr: "GR (de‑esser)",
  };
  return map[key] || key;
}

export function kpiLabel(key){
  const map = {
    track_peak_dbfs: "Picos (track)",
    bus_peak_dbfs: "Picos (bus)",
    premaster_peaks: "Picos (premaster)",
    mixbus_shortterm_lufs: "Mixbus (LUFS ST)",
    premaster_integrated_lufs: "Premaster (LUFS I)",
    streaming_integrated_lufs: "Master (LUFS I)",
    true_peak_dbtp: "True Peak",
    dynamic_range: "Dinâmica",
  };
  return map[key] || key;
}

export function pickAccent(genre){
  const a = genre?.accent || "aurora";
  const ok = new Set(["aurora","ember","neon","pulse","mist","noir"]);
  return ok.has(a) ? a : "aurora";
}
