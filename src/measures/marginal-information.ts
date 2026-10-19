import {mixProjectionLoss,type MixLossPolicy} from './mix-loss.ts';
import {add,probability,pack,zero,type Q,type RationalInput} from './rational.ts';

export type MarginalSource=Readonly<{id:string;lineage:string;values:readonly string[]}>;
export type JointAtom=Readonly<{id:string;truth:string;values:Readonly<Record<string,string>>;p?:RationalInput}>;
export type MarginalModel=Readonly<{model:'finite-declared-joint@1';truthValues:readonly string[];
  sources:readonly MarginalSource[];atoms:readonly JointAtom[]}>;
const refuse=(why:string):never=>{throw Error('REFUSE·marginal '+why);};
const names=(xs:readonly string[]|undefined)=>Array.isArray(xs)&&xs.length>0&&xs.every(x=>typeof x==='string'&&x.trim().length>0)&&new Set(xs).size===xs.length;

/** Finite declared-prior CMI, beside the algebra. Lineage labels do not enter
 * the calculation. This candidate does not alter the signed public exports.
 */
export function marginalInformation(model:MarginalModel,orders:readonly (readonly string[])[],policy:MixLossPolicy){
  if(!model||model.model!=='finite-declared-joint@1'||!Array.isArray(model.atoms))return {status:'unmeasured' as const,cause:'marginal/joint-model-required'};
  if(!names(model.truthValues)||!Array.isArray(model.sources)||!model.sources.length||!names(model.sources.map(s=>s?.id)))refuse('declared-domain-required');
  if(model.sources.some(s=>!s||typeof s.lineage!=='string'||!s.lineage.trim()||!names(s.values)))refuse('declared-source-domain-required');
  if(!policy||policy.logarithm!=='binary64-log2'||typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))refuse('numeric-policy-required');
  const ids=model.sources.map(s=>s.id);
  if(!Array.isArray(orders)||!orders.length||orders.some(o=>!Array.isArray(o)||o.length!==ids.length||new Set(o).size!==ids.length||o.some(id=>!ids.includes(id))))refuse('order-must-be-permutation');
  if(!model.atoms.length||!names(model.atoms.map(a=>a?.id)))refuse('unique-atom-ids-required');
  if(model.atoms.some(a=>!a||a.p===undefined||a.p===null))return {status:'unmeasured' as const,cause:'marginal/prior-required'};
  // A declared support-scan ceiling, not a bound on parsing, rational bit work
  // or elapsed time. The host separately enforces its process lifetime.
  const required=BigInt(model.atoms.length)*BigInt(ids.length+1)*BigInt(1+orders.length*(ids.length+1));
  if(required>BigInt(policy.budget))return {status:'unmeasured' as const,cause:'marginal/budget',required:String(required),workUnit:'declared-support-scans' as const};
  const probabilities=model.atoms.map(a=>probability(a.p!));
  const total=probabilities.reduce(add,zero);if(total[0]!==total[1])refuse('prior-must-sum-to-one');
  for(const a of model.atoms){
    if(!model.truthValues.includes(a.truth)||!a.values||Object.keys(a.values).length!==ids.length||model.sources.some(s=>!Object.hasOwn(a.values,s.id)||!s.values.includes(a.values[s.id]!)))refuse('atom-outside-domain');
  }
  const cached=new Map<string,number>();
  function conditional(selected:readonly string[]):number {
    // Explicit scalar subset projection: cache keys may sort the coordinate
    // set. The handed rows, addition orders and attributed data are untouched.
    const coordinates=[...selected].sort(),key=JSON.stringify(coordinates),held=cached.get(key);
    if(held!==undefined)return held;
    const states=new Map<string,{truth:string;tuple:string;mass:Q}>();
    model.atoms.forEach((a,i)=>{
      const truth=JSON.stringify(['truth',a.truth]),tuple=JSON.stringify(['selected',coordinates.map(id=>a.values[id])]),name=JSON.stringify([truth,tuple]);
      const previous=states.get(name);states.set(name,{truth,tuple,mass:add(previous?.mass??zero,probabilities[i]!)});
    });
    const values=[...states.values()],alphabet=[...new Set(values.flatMap(v=>[v.truth,v.tuple]))];
    // A configuration is precisely (truth, selected tuple); zero-weight truth
    // and unit-weight tuple project to that tuple. Existing loss is H(T|tuple).
    const result=mixProjectionLoss({factors:[{id:'truth-coordinate',weight:'0'},{id:'selected-coordinate',weight:'1'}],alphabet,
      configurations:values.map((v,i)=>({id:String(i),values:[v.truth,v.tuple]})),
      prior:{kind:'explicit',probabilities:values.map((v,i)=>({configuration:String(i),p:pack(v.mass)}))}},policy);
    if(result.status!=='measured')return refuse('projection-budget');
    cached.set(key,result.lossBits);return result.lossBits;
  }
  const truthEntropy=conditional([]);
  const readings=orders.map(additionOrder=>{
    const selected:string[]=[];let before=truthEntropy,sumMarginals=0;
    const steps=additionOrder.map(source=>{
      const priorSources=[...selected];selected.push(source);
      const after=conditional(selected),delta=before-after;sumMarginals+=delta;before=after;
      return {source,lineage:model.sources.find(s=>s.id===source)!.lineage,priorSources,
        deltaInformation:delta,cumulativeInformation:truthEntropy-after,remainingConditionalEntropy:after};
    });
    const totalInformation=truthEntropy-before;
    return {additionOrder:[...additionOrder],steps,totalInformation,sumMarginals,telescopingResidual:sumMarginals-totalInformation};
  });
  return {status:'measured' as const,model:model.model,unit:'bits' as const,approximation:'binary64-log2' as const,
    truthEntropy,declaredAtoms:model.atoms.length,computedSubsets:cached.size,policy,workUnit:'declared-support-scans' as const,
    required:String(required),readings,meaning:'I(truth; new source | previous sources) under one unchanged declared joint prior; lineage labels supply no ordering or independence' as const};
}
