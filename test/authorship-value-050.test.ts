import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authorshipValue,marginalInformation,type MarginalModel} from '@lapxo/obligations/measures';
const policy={logarithm:'binary64-log2' as const,budget:'10000'};
const vectors=JSON.parse(readFileSync(new URL('../vectors/laws/authorship-value.json',import.meta.url),'utf8'));
function fixture(prefix:string,negative=false):MarginalModel {
  const v=negative?vectors.negative:vectors.positive;
  return {model:'finite-declared-joint@1',truthValues:['0','1'],
    sources:['a','b'].map(id=>({id:prefix+id,lineage:prefix+'declared-lineage',values:['0','1']})),
    atoms:v.X.flatMap((x:string,i:number)=>['0','1'].map(y=>({id:prefix+x+'/'+y,truth:y,
      values:{[prefix+'a']:x[0]!,[prefix+'b']:x[1]!},p:(y==='0'?v.jointMassY0:v.jointMassY1)[i]})))};
}
const measured=(m:MarginalModel)=>{const r=authorshipValue(m,policy);assert.equal(r.status,'measured');if(r.status!=='measured')throw Error('unmeasured');return r;};
const near=(x:number,y:number)=>assert.ok(Math.abs(x-y)<1e-12,`${x} != ${y}`);
for(const prefix of ['orchard/','harbor/']){
 test(prefix+' full-support lemma identifies positive residual without losing attribution',()=>{
  const m=fixture(prefix),r=measured(m);const h=-(1/4)*Math.log2(1/4)-(3/4)*Math.log2(3/4);
  near(r.valueBits,(1-h)/2);near(r.truthGivenCountBits,1);assert.ok(r.valueBits>0);
  assert.equal(r.bothTruthValuesAtEveryPositiveConfiguration,true);
  assert.equal(r.residual.status,'identified');if(r.residual.status==='identified')near(r.residual.bits,r.valueBits);
  assert.deepEqual(r.parameters.joint,m);assert.equal(r.positiveConfigurations,4);
 });
 test(prefix+' zero-support counterexample leaves the unsupported correspondence open',()=>{
  const r=measured(fixture(prefix,true));near(r.valueBits,1/2);
  assert.equal(r.bothTruthValuesAtEveryPositiveConfiguration,false);
  assert.deepEqual(r.residual,{status:'unmeasured',cause:'authorship-value/support-with-zeros'});
  // Analytically (Y,K) reconstructs X, hence RI_H=0, unlike V=1/2.
  const v=vectors.negative;const tuples=new Set(v.X.map((x:string)=>JSON.stringify([x[0],Number(x[0])+Number(x[1])])));
  assert.equal(tuples.size,4);assert.equal(v.RI_H,'0');
 });
 test(prefix+' reuse agrees with total information minus count information',()=>{
  const m=fixture(prefix),r=measured(m),ids=m.sources.map(s=>s.id);
  const all=marginalInformation(m,[ids],policy);assert.equal(all.status,'measured');
  if(all.status==='measured')near(r.valueBits,all.readings[0]!.totalInformation-(all.truthEntropy-r.truthGivenCountBits));
  const reversed={...m,sources:[...m.sources].reverse(),atoms:[...m.atoms].reverse()};near(measured(reversed).valueBits,r.valueBits);
  const renamed={...m,sources:m.sources.map(s=>({...s,lineage:'same-control-label'}))};near(measured(renamed).valueBits,r.valueBits);
 });
}
test('missing model, prior and exhausted work budget yield no invented number',()=>{
 const m=fixture('x/');assert.equal(authorshipValue(undefined as unknown as MarginalModel,policy).status,'unmeasured');
 assert.deepEqual(authorshipValue({...m,atoms:m.atoms.map(({p,...a})=>a)},policy),{status:'unmeasured',cause:'marginal/prior-required'});
 const r=authorshipValue(m,{...policy,budget:'0'});assert.equal(r.status,'unmeasured');assert.equal('valueBits' in r,false);
});
test('domain, exact prior and IDs refuse rather than normalize',()=>{
 const m=fixture('x/');assert.throws(()=>measured({...m,truthValues:['0','1','2']}),/binary-truth-domain-required/);
 assert.throws(()=>measured({...m,sources:m.sources.map(s=>({...s,values:['0','2']}))}),/binary-source-domain-required/);
 assert.throws(()=>measured({...m,atoms:m.atoms.map(a=>({...a,p:'1/7'}))}),/prior-must-sum-to-one/);
 assert.throws(()=>measured({...m,atoms:m.atoms.map(a=>({...a,p:'-1/8'}))}),/probability outside/);
 assert.throws(()=>measured({...m,atoms:[m.atoms[0]!,...m.atoms]}),/unique-atom-ids-required/);
 assert.throws(()=>measured({...m,atoms:m.atoms.map(a=>({...a,values:{...a.values,'x/a':'2'}}))}),/atom-outside-domain/);
});
test('derived coordinate collision and zero-mass atoms cannot invent an origin or support',()=>{
 const m=fixture('');const collision={...m,sources:m.sources.map((s,i)=>({...s,id:i===0?'count':s.id})),
  atoms:m.atoms.map(a=>({...a,values:{count:a.values.a!,b:a.values.b!}}))};
 near(measured(collision).valueBits,measured(m).valueBits);assert.deepEqual(measured(collision).parameters.joint.sources,collision.sources);
 const z=fixture('',true);assert.equal(measured(z).bothTruthValuesAtEveryPositiveConfiguration,false);
});

test('conditional sufficiency does not require exchangeability',()=>{
 const m=fixture('s/'),p0=['1/4','1/8','3/8','1/4'],p1=['1/8','1/8','3/8','3/8'];
 const half=(q:string)=>{const [a,b]=q.split('/').map(Number);return `${a}/${b!*2}`;};
 const prior=m.atoms.map((a,i)=>({...a,p:half((a.truth==='0'?p0:p1)[Math.floor(i/2)]!)}));
 const r=measured({...m,atoms:prior});near(r.valueBits,0);assert.equal(r.residual.status,'identified');
 assert.notEqual(p0[1],p0[2]);
});
