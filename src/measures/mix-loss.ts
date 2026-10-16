import {add,div,one,pack,probability,rational,zero,type Q,type RationalInput} from './rational.ts';

export type NamedConfiguration=Readonly<{id:string;values:readonly string[]}>;
export type ConfigurationPrior=Readonly<{kind:'uniform'}> |
  Readonly<{kind:'explicit';probabilities:readonly Readonly<{configuration:string;p:RationalInput}>[]}>;
export type MixLossModel=Readonly<{
  factors:readonly Readonly<{id:string;weight:RationalInput}>[];
  alphabet:readonly string[];
  configurations:readonly NamedConfiguration[];
  prior?:ConfigurationPrior;
}>;
export type MixLossPolicy=Readonly<{logarithm:'binary64-log2';budget:string}>;
type MixOutput=Readonly<{kind:'value';value:string}>|Readonly<{kind:'tie';values:readonly string[]}>;
const refuse=(why:string):never=>{throw Error('REFUSE·mix-loss '+why);};
const exact=(input:RationalInput,asProbability=false):Q=>{
  try{return asProbability?probability(input):rational(input);}
  catch{return refuse('invalid '+(asProbability?'prior probability':'factor weight'));}
};
const logInteger=(n:bigint)=>{const shift=Math.max(0,n.toString(2).length-53);return Math.log2(Number(n>>BigInt(shift)))+shift;};
const logQ=(p:Q)=>logInteger(p[0])-logInteger(p[1]);
const numeric=(p:Q)=>p[0]===0n?0:2**logQ(p);
const entropy=(ps:readonly Q[])=>ps.reduce((sum,p)=>p[0]===0n?sum:sum-numeric(p)*logQ(p),0);
const uniqueNames=(names:readonly string[],what:string)=>{
  if(!Array.isArray(names)||!names.length||names.some(n=>typeof n!=='string'||!n.trim())||new Set(names).size!==names.length)
    refuse('distinct nonempty '+what+' required');
};

/** A finite, explicitly declared projection and prior; no causal model or algebraic act is inferred. */
export function mixProjectionLoss(model:MixLossModel,policy:MixLossPolicy){
  if(!policy||policy.logarithm!=='binary64-log2'||typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))
    refuse('logarithm and work budget required');
  if(!model||!Array.isArray(model.factors)||!Array.isArray(model.alphabet)||!Array.isArray(model.configurations))
    refuse('declared factors, alphabet and configuration support required');
  uniqueNames(model.factors.map(f=>f?.id),'factor IDs');
  uniqueNames(model.alphabet,'alphabet values');
  uniqueNames(model.configurations.map(c=>c?.id),'configuration IDs');
  const alphabet=new Set(model.alphabet);
  const patterns=new Set<string>();
  for(const c of model.configurations){
    if(!Array.isArray(c.values)||c.values.length!==model.factors.length||c.values.some(v=>!alphabet.has(v)))
      refuse('configuration outside declared factor/alphabet domain');
    const pattern=JSON.stringify(c.values);
    if(patterns.has(pattern))refuse('duplicate named-factor configuration');
    patterns.add(pattern);
  }
  const weights=model.factors.map(f=>exact(f.weight));
  if(weights.some(w=>w[0]<0n)||weights.every(w=>w[0]===0n))refuse('nonnegative weights with positive total required');
  const parameters={m:model.factors.length,factors:model.factors.map((f,i)=>({id:f.id,weight:pack(weights[i]!)})),
    alphabet:[...model.alphabet],configurations:model.configurations.map(c=>({id:c.id,values:[...c.values]}))};
  if(!model.prior)return {status:'unmeasured' as const,cause:'mix-loss/prior-required' as const,parameters,policy};
  // This ceiling bounds declared support size, not input parsing, rational bit work or elapsed time.
  const required=BigInt(model.configurations.length);
  if(required>BigInt(policy.budget))return {status:'unmeasured' as const,cause:'mix-loss/work-budget' as const,
    parameters,policy,required:String(required),workUnit:'declared-configurations' as const};
  let prior:Q[];
  if(model.prior.kind==='uniform')prior=model.configurations.map(()=>div(one,[BigInt(model.configurations.length),1n]));
  else if(model.prior.kind==='explicit'){
    const entries=model.prior.probabilities;
    if(!Array.isArray(entries)||entries.length!==model.configurations.length||entries.some(e=>!e||typeof e.configuration!=='string')||
      new Set(entries.map(e=>e.configuration)).size!==entries.length)refuse('one prior probability per configuration required');
    const byId=new Map(entries.map(e=>[e.configuration,exact(e.p,true)]));
    if(model.configurations.some(c=>!byId.has(c.id)))refuse('prior support differs from declared configurations');
    prior=model.configurations.map(c=>byId.get(c.id)!);
    const total=prior.reduce(add,zero);
    if(total[0]!==total[1])refuse('prior probabilities must sum exactly to one');
  }else return refuse('declared prior kind required');
  const fibers=new Map<string,{output:MixOutput;indices:number[]}>();
  const configurations=model.configurations.map((c,i)=>{
    const totals=new Map(model.alphabet.map(v=>[v,zero]));
    c.values.forEach((v,j)=>totals.set(v,add(totals.get(v)!,weights[j]!)));
    let best=zero;
    for(const total of totals.values())if(total[0]*best[1]>best[0]*total[1])best=total;
    const winners=model.alphabet.filter(v=>{const t=totals.get(v)!;return t[0]*best[1]===best[0]*t[1];});
    const output:MixOutput=winners.length===1?{kind:'value',value:winners[0]!}:{kind:'tie',values:winners};
    // All ties share one bottom output; its contenders remain visible only in the fork.
    const key=output.kind==='tie'?'tie':JSON.stringify(['value',output.value]);
    const fiber=fibers.get(key)??{output:output.kind==='tie'?{kind:'tie',values:[]}:output,indices:[]};
    fiber.indices.push(i);fibers.set(key,fiber);
    return {id:c.id,probability:pack(prior[i]!),mix:output.kind==='tie'?{kind:'tie' as const}:output,
      fork:model.factors.map((f,j)=>({factor:f.id,value:c.values[j]!}))};
  });
  const outputs=[...fibers.values()].map(f=>{
    const mass=f.indices.map(i=>prior[i]!).reduce(add,zero);
    const posterior=mass[0]===0n?[]:f.indices.map(i=>({configuration:model.configurations[i]!.id,p:div(prior[i]!,mass)}));
    return {output:f.output.kind==='tie'?{kind:'tie' as const}:f.output,probability:pack(mass),
      configurations:f.indices.map(i=>model.configurations[i]!.id),
      posterior:posterior.map(p=>({configuration:p.configuration,p:pack(p.p)})),
      conditionalBits:mass[0]===0n?null:entropy(posterior.map(p=>p.p)),mass};
  });
  const configurationBits=entropy(prior),mixBits=entropy(outputs.map(o=>o.mass));
  const lossBits=outputs.reduce((sum,o)=>sum+(o.conditionalBits===null?0:numeric(o.mass)*o.conditionalBits),0);
  return {status:'measured' as const,model:'declared-weighted-mix-projection@1' as const,parameters,
    prior:{kind:model.prior.kind,probabilities:model.configurations.map((c,i)=>({configuration:c.id,p:pack(prior[i]!)}))},
    policy,unit:'bits' as const,approximation:'binary64-log2' as const,configurationBits,mixBits,lossBits,
    entropyDifferenceBits:configurationBits-mixBits,forkLossBits:0,
    mixInjectiveOnConfigurations:[...fibers.values()].every(f=>f.indices.length===1),
    mixInjectiveOnPositiveSupport:[...fibers.values()].every(f=>f.indices.filter(i=>prior[i]![0]>0n).length<=1),
    configurations,outputs:outputs.map(({mass,...o})=>o),
    meaning:'conditional entropy of the declared configuration given its deterministic mix output; named fork is injective' as const};
}
