import {capacityP0,capacityBound,decisionInformation,mutualInformation,mixProjectionLoss} from '@lapxo/obligations/measures';
import {c_n} from '@lapxo/obligations/price';
import {partitionScale} from '../vectors-harness.ts';
import {add,mul,div,sub,probability,rational,pack,q,one,zero,type Q} from '../../src/measures/rational.ts';
import {createHash} from 'node:crypto';

const refuse=(name:string):never=>{throw Error('REFUSE·lineage '+name);};
const check=(ok:unknown,name:string):void=>{if(!ok)refuse(name);};
const near=(a:number,b:number)=>Math.abs(a-b)<=1e-12;
const sha=(s:string)=>'sha256:'+createHash('sha256').update(s).digest('hex');
const policy={logarithm:'binary64-log2' as const,budget:'100000'};
const rule='plurality-uniform-ties@1' as const;

// Reuse the shipped prior entropy via an explicitly declared identity projection.
// This fixture helper introduces no public measure, state or causal inference.
function entropy(masses:readonly Q[]):number {
  const ids=masses.map((_,i)=>String(i));
  const result=mixProjectionLoss({factors:[{id:'identity',weight:'1'}],alphabet:ids,
    configurations:ids.map(id=>({id,values:[id]})),
    prior:{kind:'explicit',probabilities:ids.map((configuration,i)=>({configuration,p:pack(masses[i]!)}))}},policy);
  if(result.status!=='measured')return refuse('entropy-budget');
  return result.configurationBits;
}
function information(joint:readonly (readonly Q[])[]):number {
  const xs=joint.map(row=>row.reduce(add,zero));
  const ys=joint[0]!.map((_,i)=>joint.reduce((sum,row)=>add(sum,row[i]!),zero));
  return entropy(xs)+entropy(ys)-entropy(joint.flat());
}
function composed(n:number,c:string,e:string,k:number){
  const downstream=decisionInformation(k,{n,c:'0',p:e},rule,policy);
  if(downstream.status!=='measured'||!('decision' in downstream))return refuse('enumeration-budget');
  const error=probability(c),right=sub(one,error),wrong=div(error,q(BigInt(n-1)));
  // downstream.decision.joint is P(Z,A) for uniform Z. Dividing P(X,Z) by
  // P(Z)=1/n cancels that n, leaving the exact symmetric kernel multiplier.
  const joint=Array.from({length:n},(_,x)=>Array.from({length:n},(_,a)=>
    Array.from({length:n},(_,z)=>mul(x===z?right:wrong,rational(downstream.decision.joint[z]![a]!))).reduce(add,zero)));
  return {k,information:information(joint),joint:joint.map(row=>row.map(pack)),
    downstreamWork:downstream.work,downstreamAccuracy:downstream.decision.accuracy};
}
export function evaluate(sample:any){
  check(sample?.model==='truth->symmetric-lineage->reports->aggregate@1','markov-model-required');
  check(sample.conditions?.truth==='uniform on n named symbols' &&
    sample.conditions?.lineageChannel==='P(Z=x|X=x)=1-c; P(Z=z|X=x)=c/(n-1) for z!=x' &&
    sample.conditions?.markov==='X -> Z -> (Y_1,...,Y_K) -> A' &&
    sample.conditions?.extraTruthAccess===false && sample.conditions?.revealedCauseIndicator===false,'declared-channel-required');
  check(sample.policy?.logarithm===policy.logarithm&&sample.policy?.budget===policy.budget,'numeric-policy-required');
  check(Array.isArray(sample.copies)&&sample.copies.length>0,'copy-cases-required');
  const copies=sample.copies.map((r:any)=>{
    const ceiling=capacityP0(r.n,r.c,policy).value;
    check(Array.isArray(r.ks)&&r.ks.length>0,'copy-counts-required');
    const rows=r.ks.map((k:number)=>{
      const result=decisionInformation(k,{n:r.n,c:r.c,p:'0'},rule,policy);
      if(result.status!=='measured'||!('decision' in result))return refuse('enumeration-budget');
      check(near(result.value,ceiling)&&near(result.decision.information,ceiling),'copy-equality');
      return {k,posteriorInformation:result.value,aggregateInformation:result.decision.information};
    });return {n:r.n,c:r.c,ceiling,rows};
  });
  const experiment=sample.finiteApproachExperiment;
  check(experiment?.reportsGivenZ==='jointly independent n-ary symmetric channels with error e' && experiment?.aggregator===rule,'conditional-iid-model-required');
  const approach=experiment.regimes.map((r:any)=>{
    const ep=probability(r.e);check(ep[0]*2n<ep[1],'recovery-regime-required');
    const ceiling=capacityP0(r.n,r.c,policy).value;
    const rows=r.ks.map((k:number)=>{
      const row=composed(r.n,r.c,r.e,k);check(row.information<=ceiling+1e-12,'data-processing-vector');
      return {...row,gap:ceiling-row.information};
    });return {n:r.n,c:r.c,e:r.e,ceiling,rows,limitCertifiedByFiniteRows:false};
  });
  // First reproduce the defect using the existing, different published model.
  const original=mutualInformation(1,{n:2,c:'1/2',p:'1/10'},policy);
  if(original.status!=='measured')return refuse('enumeration-budget');
  const zeroCeiling=capacityP0(2,'1/2',policy).value;
  check(original.value>zeroCeiling+1e-6,'nonmarkov-counterexample');
  const asymmetricJoint=[[q(1n,2n),zero],[q(1n,4n),q(1n,4n)]];
  const asymmetricInformation=information(asymmetricJoint),symmetricAtSameError=capacityP0(2,'1/4',policy).value;
  check(asymmetricInformation>symmetricAtSameError+1e-6,'symmetry-counterexample');
  // If the independent error indicator B is revealed, X is recovered exactly
  // from (Z,B) in the binary c=1/2 channel. B is not allowed side information.
  const markerJoint=[[q(1n,4n),zero,zero,q(1n,4n)],[zero,q(1n,4n),q(1n,4n),zero]];
  const markerInformation=information(markerJoint);check(near(markerInformation,1),'marker-counterexample');
  const f=sample.f1Witness,{scale,worth,at}=partitionScale(f.N),x=at(f.x),y=at(f.y);
  const residual=worth(x)+worth(y)-worth(scale.higher(x,y))-worth(scale.lower(x,y));
  check(f.N===4&&near(residual,c_n(f.N))&&near(residual,0.5),'f1-path-witness');
  check(f.uniformLiftN===16,'f1-lift-domain');
  const truthViews=Array.from({length:2},()=>Array.from({length:f.x.length*f.y.length},()=>zero));
  for(let truth=0;truth<2;truth++)for(let z=0;z<2;z++)for(let r=0;r<f.N;r++){
    const u=f.x.findIndex((b:number[])=>b.includes(r)),v=f.y.findIndex((b:number[])=>b.includes(r));
    check(u>=0&&v>=0,'f1-partition-domain');
    const answer=u*f.y.length+v;
    truthViews[truth]![answer]=add(truthViews[truth]![answer]!,q(1n,16n));
  }
  const f1={N:f.N,residual,extremal:c_n(f.N),joinBits:worth(scale.higher(x,y)),commonCoarseningBits:worth(scale.lower(x,y)),
    liftedUniformUniverse:f.uniformLiftN,liftedBound:c_n(f.uniformLiftN),
    truthViewsJoint:truthViews.map(row=>row.map(pack)),independentTruthInformation:information(truthViews),
    binaryNoiselessTruthInformation:information([[q(1n,2n),zero],[zero,q(1n,2n)]]),binaryF1Bound:c_n(2)};
  check(f1.residual>f1.independentTruthInformation && f1.binaryNoiselessTruthInformation>f1.binaryF1Bound,'f1-object-separators');
  return {model:sample.model,classification:'declared model; exact joint probabilities, approximate bits',
    copies,approach,counterexamples:{withoutMarkov:{publishedModel:original.model,parameters:original.parameters,information:original.value,misappliedCeiling:zeroCeiling},
      withoutSymmetry:{error:'1/4',joint:asymmetricJoint.map(row=>row.map(pack)),information:asymmetricInformation,misappliedCeiling:symmetricAtSameError},
      revealedIndicator:{n:2,c:'1/2',information:markerInformation,lineageOnly:zeroCeiling,revealedIndicatorBound:capacityBound(2,'1/2',policy).value}},f1,
    altersAlgebra:false,infersChannelFromUnanimity:false,asymptoticLimitVerified:false};
}

export const coordinates=['proofs/lineage-ceiling.json','samples/laws/lineage-ceiling/yes.json',
  'samples/laws/lineage-ceiling/no.json','vectors/laws/lineage-ceiling.json',
  'vectors/laws/policy.json','src/measures/capacity.ts','src/measures/mix-loss.ts',
  'src/measures/rational.ts','src/lattice/price/premium.ts','test/vectors-harness.ts',
  'vectors/laws/f1/path-witness.json','vectors/laws/f1/finite-arithmetic.json'] as const;
type Asked={lines:readonly {scope:string;measure:string;about?:string}[]};
const scope='publication/evidence/lineage-ceiling';
export function inspect(inputs:readonly (readonly [string,string])[]){
  const files=new Map(inputs);check(files.size===inputs.length,'duplicate-input');
  const read=(p:string):string=>files.get(p)??refuse('missing-input '+p);
  for(const p of coordinates)read(p);
  const vector=JSON.parse(read('vectors/laws/lineage-ceiling.json'));
  check(Array.isArray(vector.anchors)&&JSON.stringify(vector.anchors.map((a:any)=>a.path))===
    JSON.stringify(coordinates.filter(p=>p!=='vectors/laws/lineage-ceiling.json')),'anchor-inventory');
  for(const a of vector.anchors)check(sha(read(a.path))===a.sha256,'anchor-digest '+a.path);
  const result=evaluate(JSON.parse(read('samples/laws/lineage-ceiling/yes.json')));
  // Keep approximate bits subject to the shared numeric policy, but compare this
  // same-runtime recorded vector exactly; cross-engine certification is not claimed.
  check(JSON.stringify(result)===JSON.stringify(vector.result),'captured-result-differs');
  const negative=JSON.parse(read('samples/laws/lineage-ceiling/no.json'));let failure='';
  try{evaluate(negative);}catch(e){failure=String(e);}
  check(failure.includes('REFUSE·lineage markov-model-required')&&failure.includes(negative.expectedRefusal),'named-negative-missing');
  return [{scope,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}}];
}
export function receipt(asked:Asked){return inspect(asked.lines.filter(l=>l.measure==='text'&&l.about!==undefined).map(l=>[l.scope,l.about!] as const));}
