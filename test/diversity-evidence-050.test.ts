import {test} from 'node:test';import assert from 'node:assert/strict';
import {maximumDiversity,normalizedEvidence,type SimilarityModel,type ConditionalEvidence} from '@lapxo/obligations/measures';
const budget={budget:'100000'},numeric={logarithm:'binary64-log2' as const,budget:'10000',minimumPositiveBits:1e-12};
const sim=(sources:string[],matrix:string[][]):SimilarityModel=>({model:'normalized-symmetric-similarity@1',sources,matrix});
const rat=(x:any)=>Number(x.numerator)/Number(x.denominator);
const near=(x:number,y:number)=>assert.ok(Math.abs(x-y)<1e-12,`${x} != ${y}`);
export function evidence(copy=false,prefix=''):ConditionalEvidence{
 const sources=[prefix+'a',prefix+'b'],patterns=copy?['00','11']:['00','01','10','11'];
 return {model:'finite-conditional-evidence@1',truth:{positive:'present',negative:'absent'},sources,
  configurations:patterns.map(id=>({id:prefix+id,values:[id[0]!,id[1]!]})),positive:copy?['3/4','1/4']:['9/16','3/16','3/16','1/16'],negative:copy?['1/4','3/4']:['1/16','3/16','3/16','9/16'],referenceSource:sources[0]};
}
for(const prefix of ['reservoir/','shipping/']){
 test(prefix+' exact rational maximum and attained certificate',()=>{
  const m=sim([prefix+'a',prefix+'b'],[['1','1/2'],['1/2','1']]),before=JSON.stringify(m),r=maximumDiversity(m,budget);assert.equal(r.status,'measured');if(r.status!=='measured')return;
  assert.deepEqual(r.value,{numerator:'4',denominator:'3'});assert.deepEqual(r.weights.map(w=>w.p),[{numerator:'1',denominator:'2'},{numerator:'1',denominator:'2'}]);assert.equal(r.certificate.checked,'3');assert.deepEqual(r.certificate.quadratic,{numerator:'3',denominator:'4'});assert.equal(JSON.stringify(m),before);
 });
 test(prefix+' copies, singular support and ties retain all source identities',()=>{
  const m=sim([prefix+'a',prefix+'b',prefix+'a-copy'],[['1','0','1'],['0','1','0'],['1','0','1']]),r=maximumDiversity(m,budget);assert.equal(r.status,'measured');if(r.status!=='measured')return;
  near(rat(r.value),2);near(r.weights.reduce((s,w)=>s+rat(w.p),0),1);assert.deepEqual(r.weights.map(w=>w.source),m.sources);assert.ok(Number(r.certificate.singular)>0);assert.equal(r.certificate.enumeratedMaximizers,'2');
  const all=maximumDiversity(sim(m.sources,[['1','1','1'],['1','1','1'],['1','1','1']]),budget);assert.equal(all.status,'measured');if(all.status==='measured')near(rat(all.value),1);
 });
 test(prefix+' declared joint laws separate independent observations from exact copies',()=>{
  for(const copy of [false,true]){const m=evidence(copy,prefix),text=JSON.stringify(m),r=normalizedEvidence(m,numeric);assert.equal(r.status,'measured');if(r.status!=='measured')continue;
   near(r.value,copy?1:2);near(r.referenceBits,0.5*Math.log2(3));assert.deepEqual(r.parameters,m);assert.equal(JSON.stringify(m),text);
  }
 });
 test(prefix+' similarity absence, covariance, asymmetry and exhausted work never invent a maximum',()=>{
  assert.deepEqual(maximumDiversity(undefined as any,budget),{status:'unmeasured',cause:'diversity/similarity-required'});
  assert.throws(()=>maximumDiversity(sim(['a','b'],[['2','0'],['0','2']]),budget),/outside 0..1/);
  assert.throws(()=>maximumDiversity(sim(['a','b'],[['1','1/2'],['0','1']]),budget),/symmetric-similarity-required/);
  assert.equal(maximumDiversity(sim(['a'],[['1']]),{budget:'0'}).status,'unmeasured');
  assert.throws(()=>maximumDiversity(sim(['a','a'],[['1','0'],['0','1']]),budget),/source-identity/);
 });
 test(prefix+' missing truth, zero reference and incompatible support are named unmeasured readings',()=>{
  const m=evidence(true,prefix);assert.equal(normalizedEvidence({...m,positive:undefined},numeric).status,'unmeasured');assert.deepEqual(normalizedEvidence({...m,referenceSource:undefined},numeric),{status:'unmeasured',cause:'evidence/reference-required'});
  assert.deepEqual(normalizedEvidence({...m,positive:['1/2','1/2'],negative:['1/2','1/2']},numeric),{status:'unmeasured',cause:'evidence/zero-reference-divergence'});
  assert.deepEqual(normalizedEvidence({...m,positive:['1','0'],negative:['0','1']},numeric),{status:'unmeasured',cause:'evidence/incompatible-support'});
  assert.equal(normalizedEvidence(m,{...numeric,budget:'0'}).status,'unmeasured');
 });
}
test('GLS is not substituted for maximum diversity and no PSD assumption is imposed',()=>{
 const r=maximumDiversity(sim(['a','b','c'],[['1','2/5','9/10'],['2/5','1','1/25'],['9/10','1/25','1']]),budget);assert.equal(r.status,'measured');if(r.status==='measured')assert.ok(rat(r.value)<=3);
 const indefinite=maximumDiversity(sim(['a','b','c'],[['1','1','0'],['1','1','1'],['0','1','1']]),budget);assert.equal(indefinite.status,'measured');if(indefinite.status==='measured')near(rat(indefinite.value),2);
});
test('heterogeneous reference disproves a universal N <= number of sources promise',()=>{
 const m={...evidence(false),positive:['3/5','1/15','3/10','1/30'],negative:['1/30','3/10','1/15','3/5']};
 const r=normalizedEvidence(m,numeric);assert.equal(r.status,'measured');if(r.status==='measured'){assert.ok(r.value>2);near(r.referenceBits,1/3);}
});
test('conditional masses are exact, oriented and never normalized silently',()=>{
 const m=evidence();assert.throws(()=>normalizedEvidence({...m,positive:['1/2','1/2','1/2','1/2']},numeric),/conditional-normalization/);
 assert.throws(()=>normalizedEvidence({...m,configurations:[...m.configurations,m.configurations[0]!] },numeric),/declared-domain-required/);
 assert.throws(()=>normalizedEvidence({...m,referenceSource:'missing'},numeric),/declared-domain-required/);
 assert.throws(()=>normalizedEvidence(m,{...numeric,minimumPositiveBits:0}),/numeric-policy-required/);
});
test('KL orientation and declared numerical resolution are observable, not silently changed',()=>{
 const m={...evidence(true),negative:['1/2','1/2']},a=normalizedEvidence(m,numeric),b=normalizedEvidence({...m,positive:m.negative,negative:m.positive},numeric);
 assert.equal(a.status,'measured');assert.equal(b.status,'measured');if(a.status==='measured'&&b.status==='measured'){near(a.referenceBits,.75*Math.log2(1.5)+.25*Math.log2(.5));assert.notEqual(a.referenceBits,b.referenceBits);}
 assert.deepEqual(normalizedEvidence(evidence(true),{...numeric,minimumPositiveBits:1}),{status:'unmeasured',cause:'evidence/numerically-unresolved'});
 const d=10n**400n;assert.deepEqual(normalizedEvidence({...m,positive:['1/'+String(d),String(d-1n)+'/'+String(d)]},numeric),{status:'unmeasured',cause:'evidence/numeric-range'});
});
