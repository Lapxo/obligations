import {identifyM3,marginalInformation,maximumDiversity} from '@lapxo/obligations/measures';
import {add,sub,mul,one,zero,equal,pack,probability,q,type Q} from '../../src/measures/rational.ts';
const fail=(s:string):never=>{throw Error('REFUSE·shared-causes/'+s)};
const need:(b:unknown,s:string)=>asserts b=(b,s)=>{if(!b)fail(s)};
const same=(a:Q,b:Q,s:string)=>need(equal(a,b),s);
/** Fixed acceptance laws, not estimation or discovery of latent topology. */
export function validate(x:any){
 need(x?.profile==='shared-cause-boundaries@1'&&x.modelFamily==='declared-M3-and-finite-countermodels@1','model-family-required');
 need(x.scope?.unknownIncidenceIdentification==='open','topology-not-identified');
 const known=identifyM3(x.known,x.policy);need(known.status==='identified','declared-incidence-not-identified');
 need(known.factors.length===2&&known.residualSurvival.every(w=>w.privateSingletonDecomposition==='unresolved'),'known-incidence-boundary');
 const rank=identifyM3(x.rankDeficient,x.policy);need(rank.status==='unmeasured'&&rank.cause==='rank-deficient declared sharing system'&&'rank' in rank&&rank.rank===1&&'columns' in rank&&rank.columns===2,'rank-boundary');
 need(x.rankDeficient.witnesses.length>=2*x.rankDeficient.factors.length,'cardinality-case-required');
 if(x.request==='infer-from-count-only')fail('cardinality-not-identification');
 const privateCases=[x.privateSingleton.withoutSingletons,x.privateSingleton.withSingletons].map(m=>{const r=identifyM3(m,x.policy);need(r.status==='identified','private-boundary');return r});
 need(privateCases.every(r=>r.status==='identified'&&r.factors.length===0&&r.residualSurvival.every(w=>w.privateSingletonDecomposition==='unresolved')),'private-boundary');
 need(JSON.stringify(privateCases[0].residualSurvival)===JSON.stringify(privateCases[1].residualSurvival),'private-residuals-differ');
 if(x.request==='resolve-private-from-moments')fail('private-singleton-unresolved');
 need(x.request==='conditional-boundaries','unknown-request');
 const laws=x.samePairs.laws;need(Array.isArray(laws)&&laws.length===2,'two-laws-required');
 const margins= laws.map((m:any)=>{
  const ids=m.sources.map((s:any)=>s.id);need(ids.length===3,'three-sources-required');
  const result=marginalInformation(m,[ids],x.samePairs.policy);need(result.status==='measured','joint-law-unmeasured');
  const pairs:unknown[]=[];
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(const truth of ['0','1'])for(const av of ['0','1'])for(const bv of ['0','1']){
   const mass=m.atoms.filter((t:any)=>t.truth===truth&&t.values[ids[a]]===av&&t.values[ids[b]]===bv).reduce((p:Q,t:any)=>add(p,probability(t.p)),zero);
   same(mass,q(1n,8n),'conditional-pairs-differ');pairs.push(pack(mass));
  }
  return {result,pairs};
 });
 need(JSON.stringify(margins[0].pairs)===JSON.stringify(margins[1].pairs),'conditional-pairs-differ');
 need(margins[0].result.status==='measured'&&margins[1].result.status==='measured','joint-law-unmeasured');
 const information=margins.map((m:any)=>m.result.readings[0].totalInformation);
 need(Math.abs(information[0])<1e-12&&Math.abs(information[1]-1)<1e-12,'pair-information-boundary');
 const c=x.sharedChannel;need(c.model==='binary-shared-channel@1'&&c.similarityConversion==='unconditional-centered-fair-sign-correlation@1','declared-similarity-conversion-required');
 need(Array.isArray(c.sources)&&c.sources.length===2&&new Set(c.sources).size===2&&c.signals.length===1&&JSON.stringify(c.signals[0].members)===JSON.stringify(c.sources),'declared-shared-signal-required');
 const prior=probability(c.truthPrior),accuracy=probability(c.latentAccuracy),noise=probability(c.noiseFlip);
 same(prior,q(1n,2n),'fair-truth-required');same(accuracy,q(3n,4n),'nondegenerate-channel-required');same(noise,q(1n,4n),'nondegenerate-channel-required');
 need(c.atoms.length===16,'complete-channel-required');let total=zero,cross=zero;const means=[zero,zero],seen=new Set<string>();
 for(const a of c.atoms){need([0,1].includes(a.truth)&&[0,1].includes(a.signal)&&a.values.length===2&&a.values.every((v:number)=>[0,1].includes(v)),'channel-domain');
  const key=JSON.stringify([a.truth,a.signal,...a.values]);need(!seen.has(key),'duplicate-channel-state');seen.add(key);
  const p=probability(a.p),expected=a.values.reduce((p:Q,v:number)=>mul(p,v===a.signal?sub(one,noise):noise),mul(prior,a.signal===a.truth?accuracy:sub(one,accuracy)));
  same(p,expected,'channel-mass-differs');total=add(total,p);cross=add(cross,mul(p,q(a.values[0]===a.values[1]?1n:-1n)));
  a.values.forEach((v:number,i:number)=>{means[i]=add(means[i]!,mul(p,q(v===0?1n:-1n)))});
 }
 same(total,one,'channel-not-normalized');means.forEach(m=>same(m,zero,'channel-not-centered'));same(cross,q(1n,4n),'channel-cross-moment');
 const matrix=[['1',pack(cross)],[pack(cross),'1']];
 const diversity=maximumDiversity({model:'normalized-symmetric-similarity@1',sources:c.sources,matrix},c.diversityPolicy);
 need(diversity.status==='measured','diversity-unmeasured');if(diversity.status==='measured')need(diversity.value.numerator==='8'&&diversity.value.denominator==='5','diversity-is-not-cause-count');
 return {status:'conditional-boundaries-confirmed',modelFamily:x.modelFamily,known,rankDeficient:rank,privateCases,samePairs:{informationBits:information,identicalConditionalPairs:true},sharedChannel:{sources:c.sources,signals:c.signals,model:c.model,params:{truthPrior:c.truthPrior,latentAccuracy:c.latentAccuracy,noiseFlip:c.noiseFlip},similarityConversion:c.similarityConversion,matrix,diversity,declaredSharedSignals:1},unknownIncidenceIdentification:'open',experiments:0};
}
