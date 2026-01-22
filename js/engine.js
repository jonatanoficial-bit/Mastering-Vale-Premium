
function matchRule(when, decisions){
  // when supports exact match or comparisons for numeric sliders with strings like ">=75" "<=30"
  for(const [k,cond] of Object.entries(when||{})){
    const v = decisions[k];
    if(typeof cond === "string" && (cond.startsWith(">=") || cond.startsWith("<=") || cond.startsWith(">") || cond.startsWith("<"))){
      const n = Number(cond.replace(/[^\d.\-]/g,""));
      if(typeof v !== "number") return false;
      if(cond.startsWith(">=") && !(v >= n)) return false;
      if(cond.startsWith("<=") && !(v <= n)) return false;
      if(cond.startsWith(">") && !(v > n)) return false;
      if(cond.startsWith("<") && !(v < n)) return false;
      continue;
    }
    if(v !== cond) return false;
  }
  return true;
}

function applyPatch(chain, patch){
  let out = chain.slice();
  for(const op of (patch||[])){
    if(op.op === "update"){
      out = out.map(s=>{
        if(s.id !== op.stepId) return s;
        return { ...s, ...(op.fields||{}) };
      });
    }
    if(op.op === "insertAfter"){
      const idx = out.findIndex(s=> s.id === op.afterStepId);
      if(idx >= 0){
        out = out.slice(0, idx+1).concat([op.step], out.slice(idx+1));
      }else{
        out.push(op.step);
      }
    }
    if(op.op === "remove"){
      out = out.filter(s=> s.id !== op.stepId);
    }
  }
  return out;
}

export class DecisionEngine{
  constructor(blueprint){
    this.blueprint = blueprint;
  }

  resolve(decisions){
    if(!this.blueprint) return { chain:[], meterBias:{} };
    let chain = (this.blueprint.baseChain || []).map(s=> ({...s}));
    let meterBias = {};
    for(const r of (this.blueprint.rules || [])){
      if(matchRule(r.when, decisions)){
        chain = applyPatch(chain, r.patch);
        for(const [k,v] of Object.entries(r.meterBias || {})){
          meterBias[k] = (meterBias[k] || 0) + v;
        }
      }
    }
    return { chain, meterBias };
  }
}
