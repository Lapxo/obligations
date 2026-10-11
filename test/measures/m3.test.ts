import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateM3,probeUpdate,roundHalfEven,experimentM3,type ModelM3,type Conditional} from '../../src/measures/index.ts';
const model=(ids:readonly string[],p:string,factors:ModelM3['factors']=[]):ModelM3=>({cell:'x',cardinality:64,witnesses:ids.map(id=>({id,privateError:p})),selection:ids,factors});
const factor=(id:string,index:number,members:readonly string[],probability:string)=>({id,index,members,probability});
const evaluate=(m:ModelM3)=>{const r=evaluateM3(m,{budget:'100000'});assert.equal(r.status,'measured');if(r.status!=='measured')throw Error('budget');return r;};
const decimal=(r:Conditional)=>{assert.equal(r.status,'measured');return r.status==='measured'?roundHalfEven(r.value,8):'';};
test('M/3 captured covering, partial and impossible-conditioning vectors are exact',()=>{
 const a=evaluate(model(['A','B'],'1/5',[factor('cover',0,['A','B'],'1/20')]));
 assert.deepEqual(a.probabilities.true,{numerator:'76',denominator:'125'});
 assert.deepEqual(a.quantities.phi.status==='measured'&&a.quantities.phi.value,{numerator:'797',denominator:'10373'});
 assert.deepEqual(a.quantities.D.status==='measured'&&a.quantities.D.value,{numerator:'1575',denominator:'20746'});
 assert.deepEqual(['false','fired','dissent'].map(key=>roundHalfEven(a.probabilities[key as 'false'],8)),['0.05060317','0.05000000','0.34139683']);
 const b=evaluate(model(['A','B','C'],'0',[factor('cover',0,['A','B','C'],'1/5'),factor('partial',1,['A','B'],'3/10')]));
 assert.deepEqual(['true','false','dissent','majorityFalse'].map(key=>roundHalfEven(b.probabilities[key as 'true'],8)),['0.56000000','0.20000000','0.24000000','0.24000000']);
 assert.equal(decimal(b.quantities.phi),'0.26315789');assert.equal(decimal(b.quantities.falseMajorityGivenDissent),'1.00000000');assert.equal(decimal(b.quantities.falseMajorityGivenMajorityAndDissent),'1.00000000');
 const c=evaluate({...model(['A','B'],'0'),witnesses:[{id:'A',privateError:'0'},{id:'B',privateError:'1'}]});
 assert.equal(c.quantities.phi.status,'unmeasured');assert.equal(c.quantities.D.status,'unmeasured');assert.equal(roundHalfEven(c.probabilities.dissent,0),'1');
});
test('singleton governance is preserved and collision partitions distinguish zero from absence',()=>{
 const original=model(['A','B'],'1/5',[factor('A',0,['A'],'3/10'),factor('cover',1,['A','B'],'1/5')]);
 const r=evaluate(original);assert.equal(decimal(r.quantities.phi),'0.28387293');assert.equal(decimal(r.quantities.D),'0.28316249');assert.equal(roundHalfEven(r.probabilities.dissent,8),'0.49953016');
 const merged=evaluate({...model(['A','B'],'1/5',[factor('cover',1,['A','B'],'1/5')]),witnesses:[{id:'A',privateError:'11/25'},{id:'B',privateError:'1/5'}]});
 assert.equal(decimal(merged.quantities.phi),'0.35944805');assert.notDeepEqual(r.probabilities,merged.probabilities);
 assert.deepEqual(evaluate({...original,witnesses:[...original.witnesses].reverse(),factors:[...original.factors].reverse()}).probabilities,r.probabilities);
 const split=evaluate(model(['0','1','2','3'],'0',[factor('left',0,['0','1'],'1/2'),factor('right',1,['2','3'],'1/2')]));
 assert.deepEqual(split.probabilities.dissent,{numerator:'47',denominator:'63'});assert.deepEqual(split.probabilities.majorityNone,split.probabilities.dissent);
 assert.equal(decimal(split.quantities.falseMajorityGivenDissent),'0.00000000');assert.equal(split.quantities.falseMajorityGivenMajorityAndDissent.status,'unmeasured');
 assert.deepEqual(split.quantities.phi.status==='measured'&&split.quantities.phi.value,{numerator:'1',denominator:'64'});
});
test('probe uses the exact posterior and is unmeasured only at zero extension mass',()=>{
 const phi={numerator:'797',denominator:'10373'};
 assert.deepEqual(['0.2','0.98','0.99','1'].map(p=>decimal(probeUpdate(phi,p,64).result)),['0.00033016','0.06079793','0.11566116','1.00000000']);
 assert.equal(decimal(probeUpdate('0','0.2',64).result),'0.00000000');assert.equal(decimal(probeUpdate('1','0.2',64).result),'1.00000000');
 assert.equal(probeUpdate('0','1',64).result.status,'unmeasured');assert.equal(probeUpdate('1','0',64).result.status,'unmeasured');
});
test('validation and budget refuse or remain unmeasured before accumulating a partial result',()=>{
 const m=model(['A','B'],'1/5');
 assert.throws(()=>evaluateM3({...m,selection:[]},{budget:'100'}),/selection/);
 assert.throws(()=>evaluateM3({...m,witnesses:[...m.witnesses,m.witnesses[0]!]},{budget:'100'}),/witness/);
 assert.throws(()=>evaluateM3({...m,factors:[factor('f',0,['A','A'],'0')]},{budget:'100'}),/sharing/);
 assert.throws(()=>evaluateM3({...m,factors:[factor('f',0,['A'],'0'),factor('g',0,['B'],'0')]},{budget:'100'}),/index/);
 assert.throws(()=>evaluateM3({...m,witnesses:[{id:'A',privateError:'1.01'},m.witnesses[1]!]},{budget:'100'}),/probability/);
 assert.throws(()=>evaluateM3({...m,cardinality:1},{budget:'100'}),/cardinality/);
 assert.throws(()=>evaluateM3(m,{budget:'-1'}),/budget/);
 const tooSmall=evaluateM3(m,{budget:'4'});assert.equal(tooSmall.status,'unmeasured');assert.equal('probabilities' in tooSmall,false);
 const fits=evaluateM3(m,{budget:'5'});assert.equal(fits.status,'measured');assert.equal(fits.status==='measured'&&fits.work,'5');
 assert.equal(evaluateM3(model(Array.from({length:100},(_,i)=>String(i)),'0'),{budget:'100'}).status,'unmeasured');
});
test('half-even display is independent of binary floating point and uses declared digits',()=>{
 assert.equal(roundHalfEven('1.225',2),'1.22');assert.equal(roundHalfEven('1.235',2),'1.24');assert.equal(roundHalfEven('-1.225',2),'-1.22');
 assert.throws(()=>roundHalfEven('0.1',-1),/digits/);
});
test('controlled T1 and T5 declare their stream and denominators and match handed M/3 populations',()=>{
 const m=model(['A','B','C'],'1/5',[factor('cover',0,['A','B','C'],'1/20')]);
 const policy={prng:'xorshift32' as const,seed:123456789,trials:20000,randomWords:1000000};
 const r=experimentM3(m,policy),exact=evaluate(m);assert.equal(r.status,'measured');if(r.status!=='measured')return;
 assert.deepEqual(r,experimentM3(m,policy));assert.equal(r.counts.true+r.counts.false+r.counts.dissent,policy.trials);
 assert.equal(r.falseMajorityGivenMajorityAndDissent.denominator,r.counts.majorityTrue+r.counts.majorityFalse);
 const expected=exact.quantities.phi;assert.equal(expected.status,'measured');if(expected.status==='measured')assert.ok(Math.abs(Number(r.unanimity.rate)-Number(expected.value.numerator)/Number(expected.value.denominator))<.02);
 const binary=experimentM3({...model(['A','B','C'],'4/5'),cardinality:2},policy);assert.equal(binary.status,'measured');if(binary.status==='measured')assert.ok(binary.counts.majorityFalse>0);
 assert.equal(experimentM3(m,{...policy,randomWords:0}).status,'unmeasured');
});
test('partition evaluator equals direct wrong-value enumeration for overlapping factors on a three-value cell',()=>{
 const m={...model(['A','B','C'],'1/2',[factor('ab',0,['A','B'],'1/2'),factor('bc',1,['B','C'],'1/2')]),cardinality:3};
 const totals={true:0n,false:0n,fired:0n,dissent:0n,majorityTrue:0n,majorityFalse:0n,majorityNone:0n},denominator=256n;
 for(let fired=0;fired<4;fired++){
  const governors=m.selection.map(id=>m.factors.findIndex((f,i)=>(fired&(1<<i))&&f.members.includes(id))),free=governors.flatMap((g,i)=>g<0?[i]:[]);
  for(let errors=0;errors<(1<<free.length);errors++){
   const labels=new Set(governors.filter(g=>g>=0).map(g=>'f'+g));free.forEach((w,j)=>{if(errors&(1<<j))labels.add('p'+w);});const names=[...labels];
   for(let wrong=0;wrong<(1<<names.length);wrong++){
    const counts=new Map<number,number>();governors.forEach((g,i)=>{const label=g>=0?'f'+g:(errors&(1<<free.indexOf(i)))?'p'+i:undefined;const value=label===undefined?0:1+((wrong>>names.indexOf(label))&1);counts.set(value,(counts.get(value)??0)+1);});
    const weight=denominator/(1n<<BigInt(2+free.length+names.length));
    if(counts.size===1){if(counts.has(0))totals.true+=weight;else{totals.false+=weight;if(fired)totals.fired+=weight;}}
    else{totals.dissent+=weight;if((counts.get(0)??0)>1)totals.majorityTrue+=weight;else if([...counts].some(([v,n])=>v!==0&&n>1))totals.majorityFalse+=weight;else totals.majorityNone+=weight;}
   }
  }
 }
 const result=evaluate(m);const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;
 for(const key of Object.keys(totals) as (keyof typeof totals)[]){const d=gcd(totals[key],denominator);assert.deepEqual(result.probabilities[key],{numerator:String(totals[key]/d),denominator:String(denominator/d)});}
});
