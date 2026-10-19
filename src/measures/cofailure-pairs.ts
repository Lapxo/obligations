import {coincidenceExcess,type ValueReading,type TruthReading,type CoincidenceReference} from './coincidence.ts';
import {unionBoundConfidence} from './confidence.ts';
import {add,sub,mul,div,q,zero,one,pack,rational,probability,type Q,type RationalInput} from './rational.ts';

export type PairReference=Readonly<{model:'independent-categorical@1';
  marginals:readonly Readonly<{origin:string;probabilities:readonly Readonly<{value:string;p:RationalInput}>[]}>[]}>;
export type PairSampling=Readonly<{model:'iid-cells@1';epsilon:RationalInput}>;
type Common=Readonly<{origins:readonly string[];values:readonly string[];T?:number;theta?:RationalInput;
  budget:string;sampling?:PairSampling}>;
export type CofailureModel=Common & (Readonly<{variant:'oracle-false-rate';truth:readonly TruthReading[];reference:CoincidenceReference}> |
  Readonly<{variant:'categorical-match-excess';reference?:PairReference;truth?:never}>);
const refuse=(cause:string):never=>{throw Error('REFUSE·cofailure '+cause);};
const named=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const compare=(a:Q,b:Q)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
const max=(a:Q,b:Q)=>compare(a,b)>=0?a:b;
const min=(a:Q,b:Q)=>compare(a,b)<=0?a:b;

/** Candidate descriptive measures beside the existing algebra. The caller hands
 * the frame, threshold and reference. No truth, causal group or iid design is inferred.
 * This new module is not yet added to the signed public export declaration.
 */
export function cofailurePairs(rows:readonly ValueReading[],model:CofailureModel){
  if(!model||model.T===undefined||model.theta===undefined)return {status:'unmeasured' as const,cause:'cofailure/T-and-theta-required'};
  if(!Number.isSafeInteger(model.T)||model.T<1)refuse('invalid-T');
  if(!Array.isArray(rows)||!Array.isArray(model.origins)||model.origins.length<2||model.origins.some(id=>!named(id))||new Set(model.origins).size!==model.origins.length)refuse('invalid-origins-or-rows');
  if(!Array.isArray(model.values)||model.values.length<2||model.values.some(v=>!named(v))||new Set(model.values).size!==model.values.length)refuse('invalid-alphabet');
  if(model.variant!=='oracle-false-rate'&&model.variant!=='categorical-match-excess')refuse('declared-variant-required');
  if(typeof model.budget!=='string'||!/^\d+$/.test(model.budget))refuse('budget-required');
  const theta=rational(model.theta);
  if(compare(theta,one)>0||compare(theta,model.variant==='oracle-false-rate'?zero:q(-1n))<0)refuse('invalid-threshold');
  const origins=[...model.origins].sort(),M=origins.length*(origins.length-1)/2;
  const truth=model.variant==='oracle-false-rate'?model.truth:[];
  if(!Array.isArray(truth))refuse('truth-array-required');
  if(model.variant==='categorical-match-excess'&&Object.hasOwn(model,'truth'))refuse('non-oracle-truth-input');
  const required=BigInt(M)*(3n*BigInt(rows.length)+BigInt(truth.length)+BigInt(model.values.length)+2n)+BigInt(rows.length)+BigInt(model.T)*BigInt(origins.length);
  if(required>BigInt(model.budget))return {status:'unmeasured' as const,cause:'cofailure/budget',required:String(required)};
  const alphabet=new Set(model.values),selected=new Set(origins),events=new Map<string,Map<string,string>>();
  for(const row of rows){
    if(!row||!named(row.event)||!named(row.origin)||!alphabet.has(row.value))refuse('invalid-value-reading');
    if(!selected.has(row.origin))continue;
    const at=events.get(row.event)??new Map<string,string>();
    if(at.has(row.origin)&&at.get(row.origin)!==row.value)refuse('conflicting-value '+row.event+'/'+row.origin);
    at.set(row.origin,row.value);events.set(row.event,at);
  }
  if(events.size!==model.T||[...events.values()].some(at=>at.size!==origins.length))return {status:'unmeasured' as const,cause:'cofailure/incomplete-declared-frame',events:events.size,T:model.T};
  const marginals=new Map<string,Map<string,Q>>();
  if(model.variant==='oracle-false-rate'&&model.reference?.marginals==='handed'){
    const errors=model.reference.errors;
    if(!Array.isArray(errors)||errors.length!==origins.length||errors.some(e=>!e)||new Set(errors.map(e=>e.origin)).size!==origins.length||errors.some(e=>!selected.has(e.origin)))refuse('oracle-reference-origins');
  }
  if(model.variant==='categorical-match-excess'){
    if(!model.reference)return {status:'unmeasured' as const,cause:'cofailure/reference-required'};
    if(model.reference.model!=='independent-categorical@1'||!Array.isArray(model.reference.marginals)||model.reference.marginals.length!==origins.length)refuse('categorical-reference-required');
    for(const row of model.reference.marginals){
      if(!row||!selected.has(row.origin)||marginals.has(row.origin)||!Array.isArray(row.probabilities)||row.probabilities.length!==alphabet.size)refuse('reference-origins-or-values');
      const values=new Map<string,Q>();
      for(const p of row.probabilities){if(!p||!alphabet.has(p.value)||values.has(p.value))refuse('reference-origins-or-values');values.set(p.value,probability(p.p));}
      const total=[...values.values()].reduce(add,zero);if(compare(total,one)!==0)refuse('reference-not-normalized');
      marginals.set(row.origin,values);
    }
  }
  const pairs=[];
  for(let i=0;i<origins.length;i++)for(let j=i+1;j<origins.length;j++){
    const a=origins[i]!,b=origins[j]!;let observed:Q,expected:Q;
    if(model.variant==='oracle-false-rate'){
      if(!model.reference||!Array.isArray(model.reference.values)||model.reference.values.length!==alphabet.size||model.reference.values.some(v=>!alphabet.has(v)))refuse('oracle-reference-alphabet');
      const reference=model.reference.marginals==='handed'?{...model.reference,errors:model.reference.errors.filter(e=>e.origin===a||e.origin===b)}:model.reference;
      const reading=coincidenceExcess(rows,truth,[a,b],reference,{minEvents:model.T,minEventsPerTruth:1,budget:model.budget});
      if(reading.status!=='measured')return {status:'unmeasured' as const,cause:'cofailure/oracle '+reading.cause};
      observed=rational(reading.observed);expected=rational(reading.expected);
    }else{
      let count=0;for(const row of events.values())if(row.get(a)===row.get(b))count++;
      observed=q(BigInt(count),BigInt(model.T));
      expected=model.values.map(v=>mul(marginals.get(a)!.get(v)!,marginals.get(b)!.get(v)!)).reduce(add,zero);
    }
    const excess=sub(observed,expected),score=model.variant==='oracle-false-rate'?observed:excess;
    pairs.push({origins:[a,b] as const,observed:pack(observed),expected:pack(expected),excess:pack(excess),score:pack(score),edge:compare(score,theta)>0});
  }
  const parent=origins.map((_,i)=>i),find=(i:number):number=>parent[i]===i?i:find(parent[i]!);
  for(const p of pairs)if(p.edge)parent[find(origins.indexOf(p.origins[0]))]=find(origins.indexOf(p.origins[1]));
  const groups=new Map<number,string[]>();origins.forEach((id,i)=>{const key=find(i);groups.set(key,[...(groups.get(key)??[]),id]);});
  const components=[...groups.values()].sort((a,b)=>a[0]!.localeCompare(b[0]!));
  let uncertainty:unknown={status:'unmeasured',cause:'cofailure/sampling-design-required'};
  if(model.sampling){
    if(model.sampling.model!=='iid-cells@1')refuse('sampling-model-required');
    const epsilon=probability(model.sampling.epsilon);if(compare(epsilon,zero)<=0)refuse('positive-epsilon-required');
    const failure=min(one,div(one,mul(q(4n*BigInt(model.T)),mul(epsilon,epsilon))));
    const confidence=unionBoundConfidence(pairs.map((p,i)=>({id:'pair-'+i,p:pack(failure),justification:'Chebyshev: declared iid Bernoulli indicators, variance <= 1/4; fixed handed reference'})));
    const intervals=pairs.map(p=>{
      const score=rational(p.score),expected=rational(p.expected),low=model.variant==='oracle-false-rate'?zero:sub(zero,expected),high=model.variant==='oracle-false-rate'?one:sub(one,expected);
      const lo=max(low,sub(score,epsilon)),hi=min(high,add(score,epsilon));
      return {origins:p.origins,lo:pack(lo),hi:pack(hi),decision:compare(lo,theta)>0?'above':compare(hi,theta)<0?'below':'unresolved'};
    });
    uncertainty={status:'conditional',model:model.sampling.model,epsilon:pack(epsilon),perPairFailureUpper:pack(failure),confidence,
      intervals,thresholdGraphResolved:intervals.every(i=>i.decision!=='unresolved'),
      conditionalGraphCertificate:!confidence.trivial&&intervals.every(i=>i.decision!=='unresolved'),
      meaning:'fixed-frame threshold graph only, conditional on the handed iid design; neither causal grouping nor iid was inferred'};
  }
  return {status:'measured' as const,variant:model.variant,T:model.T,theta:pack(theta),origins,pairs,components,uncertainty,
    scoreMeaning:model.variant==='oracle-false-rate'?'same wrong answer / T':'same answer / T minus handed independent-categorical reference',
    interpretation:'descriptive threshold components, not identified causes or probability of truth' as const};
}
