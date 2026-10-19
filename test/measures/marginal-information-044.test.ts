import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marginalInformation} from '../../src/measures/marginal-information.ts';
import {evaluate} from '../support/marginal-reader.ts';
const sample=JSON.parse(readFileSync(new URL('../../samples/laws/marginal-information/yes.json',import.meta.url),'utf8'));
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);

test('marginal: one joint table in both orders, equal totals and zero gain from an exact copy',()=>{
  const result=evaluate(sample),c=result.cases[0];
  assert.equal(c.orderJointIdentities[0],c.orderJointIdentities[1]);
  near(c.reading.readings[0].steps[0].deltaInformation,0.18872187554086706);
  near(c.reading.readings[0].steps[1].deltaInformation,0);
  near(c.reading.readings[0].steps[2].deltaInformation,0.14315587846583222);
  for(const order of c.reading.readings){near(order.totalInformation,0.3318777540066993);near(order.sumMarginals,order.totalInformation);}
  assert.equal((c.comparison as any).conditionalGarbling.holds,true);
  assert.equal(c.lineageRelabelLeavesDeltasUnchanged,true);
});

test('marginal: equal individual accuracy and information do not order sources by lineage',()=>{
  const c=evaluate(sample).cases[1];
  for(const quality of c.qualities){assert.deepEqual(quality.predictionAccuracy,{numerator:'1',denominator:'2'});near(quality.individualInformation,1);}
  assert.deepEqual(c.reading.readings.map((r:any)=>r.steps.map((s:any)=>s.deltaInformation)),[[1,1,0],[1,0,1]]);
  assert.equal((c.comparison as any).conditionalGarbling.holds,false);
  near((c.comparison as any).sameGain,1);near((c.comparison as any).otherGain,0);
});

test('marginal: XOR synergy, saturation and lossy majority are distinct from conditional information',()=>{
  const cases=evaluate(sample).cases;
  assert.deepEqual(cases[2].reading.readings.map((r:any)=>r.steps.map((s:any)=>s.deltaInformation)),[[0,1],[0,1]]);
  assert.deepEqual(cases[3].reading.readings.map((r:any)=>r.steps.map((s:any)=>s.deltaInformation)),[[1,0],[1,0]]);
  const mix=cases[4].mixCounterexample as any;
  assert.deepEqual(mix.profiles.map((p:any)=>p.mixInformation),[1,1,0]);
  for(const r of cases[4].reading.readings)near(r.totalInformation,1);
});

test('marginal: absent priors are unmeasured; bad orders and nonnormalized joint laws refuse',()=>{
  const c=sample.cases[0],before=JSON.stringify(c.model);
  assert.throws(()=>marginalInformation(c.model,[['a','a','b']],sample.policy),/REFUSE·marginal order-must-be-permutation/);
  const missing=structuredClone(c.model);delete missing.atoms[0].p;
  assert.equal(marginalInformation(missing,c.orders,sample.policy).status,'unmeasured');
  const bad=structuredClone(c.model);bad.atoms[0].p='1/2';
  assert.throws(()=>marginalInformation(bad,c.orders,sample.policy),/REFUSE·marginal prior-must-sum-to-one/);
  assert.equal(marginalInformation(c.model,c.orders,{...sample.policy,budget:'0'}).status,'unmeasured');
  assert.equal(JSON.stringify(c.model),before);
});
