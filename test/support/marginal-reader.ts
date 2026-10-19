import {marginalInformation,type MarginalModel} from '../../src/measures/marginal-information.ts';
import {mixProjectionLoss} from '@lapxo/obligations/measures';
import {add,mul,equal,probability,pack,zero,type Q} from '../../src/measures/rational.ts';
import {createHash} from 'node:crypto';
const fail=(name:string):never=>{throw Error('REFUSE·marginal-vector '+name);};
const check=(ok:unknown,name:string):void=>{if(!ok)fail(name);};
const near=(a:number,b:number)=>Math.abs(a-b)<=1e-12;
function canonicalJSON(value:any):string {
  if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJSON(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
const sha=(text:string)=>'sha256:'+createHash('sha256').update(text).digest('hex');
function measured(value:ReturnType<typeof marginalInformation>){if(value.status!=='measured')return fail('unexpected-unmeasured '+value.cause);return value;}
// Exact finite check of T _||_ same | (previous, other), not a causal inference.
function garbling(model:MarginalModel,previous:string[],same:string,other:string){
  const joint=new Map<string,Q>(),xso=new Map<string,Q>(),dso=new Map<string,Q>(),so=new Map<string,Q>();
  const contexts=new Map<string,unknown[]>();
  const put=(m:Map<string,Q>,k:unknown[],p:Q)=>{const key=JSON.stringify(k);m.set(key,add(m.get(key)??zero,p));};
  for(const a of model.atoms){
    const context=[previous.map(id=>a.values[id]),a.values[other]],p=probability(a.p!);
    contexts.set(JSON.stringify(context),context);put(so,context,p);put(xso,[a.truth,...context],p);
    put(dso,[a.values[same],...context],p);put(joint,[a.truth,a.values[same],...context],p);
  }
  let checks=0,holds=true;
  for(const context of contexts.values())for(const truth of model.truthValues)for(const value of model.sources.find(s=>s.id===same)!.values){
    const get=(m:Map<string,Q>,k:unknown[])=>m.get(JSON.stringify(k))??zero;
    if(!equal(mul(get(joint,[truth,value,...context]),get(so,context)),mul(get(xso,[truth,...context]),get(dso,[value,...context]))))holds=false;
    checks++;
  }return {holds,exactFactorizationChecks:checks};
}
export function evaluate(sample:any){
  check(sample?.id==='marginal-information-models@1'&&Array.isArray(sample.cases),'sample-id');
  const cases=sample.cases.map((c:any)=>{
    check(Array.isArray(c.orders)&&c.orders.length===2&&JSON.stringify(c.orders[0])!==JSON.stringify(c.orders[1]),'two-distinct-orders-required');
    const before=canonicalJSON(c.model),jointSha256=sha(before),reading=measured(marginalInformation(c.model,c.orders,sample.policy));
    const qualities=c.model.sources.map((source:any)=>{
      const order=[source.id,...c.model.sources.map((s:any)=>s.id).filter((id:string)=>id!==source.id)];
      const singleton=measured(marginalInformation(c.model,[order],sample.policy));
      const accuracy=c.model.atoms.reduce((sum:Q,a:any)=>a.values[source.id]===a.truth?add(sum,probability(a.p)):sum,zero);
      return {source:source.id,declaredLineage:source.lineage,predictionAccuracy:pack(accuracy),individualInformation:singleton.readings[0]!.steps[0]!.cumulativeInformation};
    });
    for(const order of reading.readings){
      check(near(order.sumMarginals,order.totalInformation),'chain-sum');
      check(order.steps.every(s=>s.deltaInformation>=-1e-12),'negative-cmi');
      check(near(order.totalInformation,reading.readings[0]!.totalInformation),'order-total');
    }
    let comparison:unknown=null;
    if(c.comparison){
      const {previous,same,other}=c.comparison;
      const all=c.model.sources.map((s:any)=>s.id),prefix=(id:string)=>[...previous,id,...all.filter((s:string)=>!previous.includes(s)&&s!==id)];
      const sides=measured(marginalInformation(c.model,[prefix(same),prefix(other)],sample.policy));
      const sameGain=sides.readings[0]!.steps[previous.length]!.deltaInformation,otherGain=sides.readings[1]!.steps[previous.length]!.deltaInformation;
      const hypothesis=garbling(c.model,previous,same,other);
      if(hypothesis.holds)check(sameGain<=otherGain+1e-12,'conditional-comparison');
      comparison={previous,same,other,sameGain,otherGain,otherMinusSame:otherGain-sameGain,conditionalGarbling:hypothesis};
    }
    const renamed={...c.model,sources:c.model.sources.map((s:any,i:number)=>({...s,lineage:'renamed-'+i}))};
    const renamedReading=measured(marginalInformation(renamed,c.orders,sample.policy));
    check(reading.readings.every((r,i)=>r.steps.every((s,j)=>s.deltaInformation===renamedReading.readings[i]!.steps[j]!.deltaInformation)),'labels-affect-information');
    let mixCounterexample:unknown=null;
    if(c.id==='majority-is-not-the-joint-observation'){
      check(c.model.atoms.length===c.model.truthValues.length&&new Set(c.model.atoms.map((a:any)=>a.truth)).size===c.model.atoms.length,'mix-truth-determines-config');
      const profiles=[];
      for(let count=1;count<=c.orders[0].length;count++){
        const selected=c.orders[0].slice(0,count);
        const mix=mixProjectionLoss({factors:selected.map((id:string)=>({id,weight:'1'})),alphabet:['0','1'],
          configurations:c.model.atoms.map((a:any)=>({id:a.id,values:selected.map((id:string)=>a.values[id])})),
          prior:{kind:'explicit',probabilities:c.model.atoms.map((a:any)=>({configuration:a.id,p:a.p}))}},sample.policy);
        check(mix.status==='measured','mix-unmeasured');if(mix.status!=='measured')return fail('mix-unmeasured');
        profiles.push({selected,mixInformation:mix.mixBits,mixLoss:mix.lossBits,outputs:mix.outputs});
      }
      mixCounterexample={meaning:'truth determines the full configuration in this fixture, so I(truth;mix)=H(mix)',profiles};
    }
    check(canonicalJSON(c.model)===before,'mutated-joint');
    return {id:c.id,jointSha256,reading,orderJointIdentities:c.orders.map(()=>jointSha256),qualities,comparison,mixCounterexample,lineageRelabelLeavesDeltasUnchanged:true};
  });
  const first=sample.cases[0],withoutPrior=structuredClone(first.model);delete withoutPrior.atoms[0].p;
  return {classification:'conditional information under one declared joint prior; not a lineage ranking',cases,
    missingPrior:marginalInformation(withoutPrior,first.orders,sample.policy),
    missingModel:marginalInformation(undefined as any,first.orders,sample.policy),
    publicExportAdded:false,empiricalOrTruthFreeEstimate:false};
}
export const coordinates=['proofs/marginal-information.json','samples/laws/marginal-information/yes.json','samples/laws/marginal-information/no.json',
  'vectors/laws/marginal-information.json','vectors/laws/policy.json','src/measures/marginal-information.ts','src/measures/mix-loss.ts','src/measures/rational.ts'] as const;
type Asked={lines:readonly {scope:string;measure:string;about?:string}[]};
const scope='publication/evidence/marginal-information';
export function inspect(inputs:readonly (readonly [string,string])[]){
  const files=new Map(inputs);check(files.size===inputs.length,'duplicate-input');const read=(p:string)=>files.get(p)??fail('missing-input '+p);
  for(const p of coordinates)read(p);
  const vector=JSON.parse(read('vectors/laws/marginal-information.json'));
  check(vector.id==='marginal-information/one-joint-two-orders','vector-id');
  check(JSON.stringify(vector.anchors.map((a:any)=>a.path))===JSON.stringify(coordinates.filter(p=>p!=='vectors/laws/marginal-information.json')),'anchor-inventory');
  for(const a of vector.anchors)check(sha(read(a.path))===a.sha256,'anchor-digest '+a.path);
  const sample=JSON.parse(read('samples/laws/marginal-information/yes.json'));
  check(JSON.stringify(evaluate(sample))===JSON.stringify(vector.result),'captured-result-differs');
  const no=JSON.parse(read('samples/laws/marginal-information/no.json')),given=sample.cases.find((c:any)=>c.id===no.case);let why='';
  check(no.expectedRefusal==='REFUSE·marginal order-must-be-permutation'&&given,'negative-contract');
  try{marginalInformation(given.model,no.orders,sample.policy);}catch(e){why=String(e);}
  check(why.includes(no.expectedRefusal),'named-negative-missing');
  return [{scope,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}}];
}
export function receipt(asked:Asked){return inspect(asked.lines.filter(l=>l.measure==='text'&&l.about!==undefined).map(l=>[l.scope,l.about!] as const));}
