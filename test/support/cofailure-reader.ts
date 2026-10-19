import {cofailurePairs,type CofailureModel} from '../../src/measures/cofailure-pairs.ts';
import {coincidenceExcess,type ValueReading,type TruthReading} from '@lapxo/obligations/measures';
import {q,pack,rational,probability,add,sub,mul,div,pow,zero,one,type Q} from '../../src/measures/rational.ts';
import {createHash} from 'node:crypto';
const fail=(name:string):never=>{throw Error('REFUSE·cofailure-vector '+name);};
const check=(ok:unknown,name:string):void=>{if(!ok)fail(name);};
const cmp=(a:Q,b:Q)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
export function fixture(sample:any,spec:any){
  check(Number.isSafeInteger(spec.T)&&spec.T>0&&spec.T<=400,'declared-fixture-size');
  check(spec.blocks.reduce((sum:number,b:any)=>sum+b.count,0)===spec.T,'fixture-count');
  const rows:ValueReading[]=[],truth:TruthReading[]=[];
  for(const block of spec.blocks){
    check(Number.isSafeInteger(block.count)&&block.count>0&&block.values.length===sample.origins.length,'fixture-block');
    for(let i=0;i<block.count;i++){
      const event='e'+truth.length;truth.push({event,value:block.truth,kind:'truth'});
      sample.origins.forEach((origin:string,j:number)=>rows.push({event,origin,value:block.values[j]}));
    }
  }return {rows,truth};
}
function measured(result:ReturnType<typeof cofailurePairs>){if(result.status!=='measured')return fail('unexpected-unmeasured '+result.cause);return result;}
function gap(reading:ReturnType<typeof measured>,groups:string[][]){
  const inside:Q[]=[],outside:Q[]=[];
  for(const p of reading.pairs)(groups.some(g=>p.origins.every(o=>g.includes(o)))?inside:outside).push(rational(p.score));
  check(inside.length>0&&outside.length>0,'reference-partition');
  const minInside=inside.reduce((a,b)=>cmp(a,b)<0?a:b),maxOutside=outside.reduce((a,b)=>cmp(a,b)>0?a:b),theta=rational(reading.theta);
  return {minInside:pack(minInside),maxOutside:pack(maxOutside),
    meanInside:pack(div(inside.reduce(add,zero),q(BigInt(inside.length)))),meanOutside:pack(div(outside.reduce(add,zero),q(BigInt(outside.length)))),
    strictPopulationGapForHandedTable:cmp(maxOutside,theta)<0&&cmp(theta,minInside)<0};
}
export function evaluate(sample:any){
  check(sample?.id==='cofailure-pairs-models@1','sample-id');
  const common={origins:sample.origins,values:sample.values,budget:sample.budget};
  const reference={model:'independent-uniform-wrong@1' as const,values:sample.values,marginals:'estimated-by-truth' as const};
  const separated=fixture(sample,sample.separated),base={...common,T:sample.separated.T};
  const oracleModel={...base,variant:'oracle-false-rate' as const,truth:separated.truth,reference,theta:sample.separated.oracleTheta,sampling:{model:'iid-cells@1' as const,epsilon:sample.separated.oracleEpsilon}};
  const observationalModel={...base,variant:'categorical-match-excess' as const,reference:sample.handedCategoricalReference,theta:sample.separated.observationalTheta,sampling:{model:'iid-cells@1' as const,epsilon:sample.separated.observationalEpsilon}};
  const oracle=measured(cofailurePairs(separated.rows,oracleModel)),observational=measured(cofailurePairs(separated.rows,observationalModel));
  check(JSON.stringify(oracle.components)===JSON.stringify(sample.separated.referenceGroups),'oracle-components');
  check(JSON.stringify(observational.components)===JSON.stringify(sample.separated.referenceGroups),'observational-components');
  const changedTruth=separated.truth.map(t=>({...t,value:separated.rows.find(r=>r.event===t.event&&r.origin===sample.sameReportsOtherTruth.truthFromOrigin)!.value}));
  const otherTruth=measured(cofailurePairs(separated.rows,{...oracleModel,truth:changedTruth}));
  check(JSON.stringify(otherTruth.pairs)!==JSON.stringify(oracle.pairs),'truth-counterexample');
  const shared=fixture(sample,sample.sharedQuestion);
  const sharedOracle=measured(cofailurePairs(shared.rows,{...oracleModel,truth:shared.truth,T:sample.sharedQuestion.T}));
  const sharedObservable=measured(cofailurePairs(shared.rows,{...observationalModel,T:sample.sharedQuestion.T}));
  check(sharedOracle.pairs.every(p=>rational(p.observed)[0]===0n)&&sharedObservable.pairs.every(p=>cmp(rational(p.excess),q(1n,2n))===0),'shared-question-counterexample');
  const betweenData=fixture(sample,sample.betweenMeans);
  const between=measured(cofailurePairs(betweenData.rows,{...oracleModel,T:sample.betweenMeans.T,theta:sample.betweenMeans.theta,truth:betweenData.truth}));
  const betweenGap=gap(between,sample.betweenMeans.referenceGroups);
  check(!betweenGap.strictPopulationGapForHandedTable&&between.components.length===1,'between-means-counterexample');
  const sleep=fixture(sample,sample.finiteConfusion);
  const finite=measured(cofailurePairs(sleep.rows,{...oracleModel,T:sample.finiteConfusion.T,theta:sample.finiteConfusion.theta,truth:sleep.truth,sampling:{model:'iid-cells@1',epsilon:sample.finiteConfusion.epsilon}}));
  const allCorrectCell=mul(sub(one,probability(sample.finiteConfusion.c)),pow(sub(one,probability(sample.finiteConfusion.e)),4)),allCorrectBatch=pow(allCorrectCell,sample.finiteConfusion.T);
  const noTruth=coincidenceExcess(separated.rows,[],sample.origins,reference,{minEvents:400,minEventsPerTruth:1,budget:sample.budget});
  check(noTruth.status==='unmeasured','published-oracle-boundary');
  const missingT=cofailurePairs(separated.rows,{...oracleModel,T:undefined}),missingTheta=cofailurePairs(separated.rows,{...oracleModel,theta:undefined});
  const missingReference=cofailurePairs(separated.rows,{...observationalModel,reference:undefined});
  const noSampling=measured(cofailurePairs(separated.rows,{...observationalModel,sampling:undefined}));
  const redelivery=cofailurePairs([...separated.rows,...separated.rows].reverse(),oracleModel);
  check(JSON.stringify(redelivery)===JSON.stringify(oracle),'redelivery');
  return {classification:'descriptive measures with declared models; no cause identification',oracle,observational,
    handedTableGaps:{oracle:gap(oracle,sample.separated.referenceGroups),observational:gap(observational,sample.separated.referenceGroups)},
    counterexamples:{sameReportsDifferentTruth:{sameResponseBytes:true,observationalOutputUnchanged:true,otherOracle:otherTruth},
      sharedQuestion:{oracle:sharedOracle,observational:sharedObservable},betweenMeans:{reading:between,gap:betweenGap},
      finiteCEqualsE:{c:sample.finiteConfusion.c,e:sample.finiteConfusion.e,reading:finite,allCorrectPerCell:pack(allCorrectCell),allCorrectBatch:pack(allCorrectBatch)}},
    boundaries:{publishedCoincidenceWithoutTruth:noTruth,missingT,missingTheta,missingReference,noSamplingUncertainty:noSampling.uncertainty,redeliveryIdempotent:true},
    populationIdentification:false,iidVerified:false,publicExportAdded:false};
}
export const coordinates=['proofs/cofailure-pairs.json','samples/laws/cofailure-pairs/yes.json','samples/laws/cofailure-pairs/no.json',
  'vectors/laws/cofailure-pairs.json','vectors/laws/policy.json','src/measures/cofailure-pairs.ts','src/measures/coincidence.ts',
  'src/measures/confidence.ts','src/measures/rational.ts'] as const;
type Asked={lines:readonly {scope:string;measure:string;about?:string}[]};
const scope='publication/evidence/cofailure-pairs',sha=(text:string)=>'sha256:'+createHash('sha256').update(text).digest('hex');
export function inspect(inputs:readonly (readonly [string,string])[]){
  const files=new Map(inputs);check(files.size===inputs.length,'duplicate-input');
  const read=(p:string)=>files.get(p)??fail('missing-input '+p);for(const p of coordinates)read(p);
  const vector=JSON.parse(read('vectors/laws/cofailure-pairs.json'));
  check(vector.id==='cofailure-pairs/two-declared-observables','vector-id');
  check(JSON.stringify(vector.anchors.map((a:any)=>a.path))===JSON.stringify(coordinates.filter(p=>p!=='vectors/laws/cofailure-pairs.json')),'anchor-inventory');
  for(const a of vector.anchors)check(sha(read(a.path))===a.sha256,'anchor-digest '+a.path);
  const sample=JSON.parse(read('samples/laws/cofailure-pairs/yes.json'));
  check(JSON.stringify(evaluate(sample))===JSON.stringify(vector.result),'captured-result-differs');
  const negative=JSON.parse(read('samples/laws/cofailure-pairs/no.json')),given=fixture(sample,sample.separated);let refusal='';
  check(negative.expectedRefusal==='REFUSE·cofailure conflicting-value e0/a','negative-contract');
  try{cofailurePairs([...given.rows,negative.mutation],{variant:'categorical-match-excess',origins:sample.origins,values:sample.values,budget:sample.budget,T:sample.separated.T,theta:'0',reference:sample.handedCategoricalReference});}catch(e){refusal=String(e);}
  check(refusal.includes(negative.expectedRefusal),'named-negative-missing');
  return [{scope,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}}];
}
export function receipt(asked:Asked){return inspect(asked.lines.filter(l=>l.measure==='text'&&l.about!==undefined).map(l=>[l.scope,l.about!] as const));}
