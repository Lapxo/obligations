import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unionBoundConfidence,type DeclaredFailure} from '../../src/measures/confidence.ts';
const declaration=(id:string,p:string)=>({id,p,justification:`hypothesis:${id}`});
test('T18 exact union-bound; no independence premise',()=>{
  const samples=JSON.parse(readFileSync(new URL('../../samples/measures/confidence/union-bound.json',import.meta.url),'utf8'));
  const failures=samples.yes.failures,before=JSON.stringify(failures);
  assert.deepEqual(unionBoundConfidence(samples.trivial.failures).value,samples.trivial.expectedLowerBound);
  assert.throws(()=>unionBoundConfidence(samples.no.failures),/justification reference required/);
  const result=unionBoundConfidence(failures);
  assert.deepEqual(result.value,{numerator:'7',denominator:'10'});
  assert.deepEqual(result.failureSum,{numerator:'3',denominator:'10'});
  assert.equal(result.status,'conditional-bound');assert.equal(result.trivial,false);
  assert.deepEqual(unionBoundConfidence([...failures].reverse()).value,result.value);
  assert.equal(JSON.stringify(failures),before);
  // On 10 equally likely outcomes: disjoint failure sets of sizes 1 and 2
  // attain 7/10; overlapping sets of sizes 1 and 2 give 8/10, above this bound.
  for(const failed of [new Set([0,1,2]),new Set([0,1])])assert.ok((10-failed.size)/10>=.7);
});
test('T18 sum equal to or above one is explicitly trivial, never negative',()=>{
  for(const ps of [['1/2','1/2'],['3/5','3/5']]){
    const result=unionBoundConfidence(ps.map((p,i)=>declaration(String(i),p)));
    assert.deepEqual(result.value,{numerator:'0',denominator:'1'});assert.equal(result.trivial,true);
  }
  const empty=unionBoundConfidence([]);
  assert.deepEqual(empty.value,{numerator:'1',denominator:'1'});
  assert.deepEqual(empty.failureSum,{numerator:'0',denominator:'1'});
  assert.deepEqual(empty.declarations,[]);
  assert.equal(empty.trivial,false);
  const vector=JSON.parse(readFileSync(new URL('../../vectors/measures/confidence/expected.json',import.meta.url),'utf8'));
  for(const {p,lowerBound} of vector.values){
    const result=unionBoundConfidence(p.map((value:string,i:number)=>declaration(String(i),value)));
    const [numerator,denominator='1']=lowerBound.split('/');
    assert.deepEqual(result.value,{numerator,denominator});
  }
});
test('T18 agreement cannot replace missing probabilities or justification',()=>{
  assert.throws(()=>unionBoundConfidence([{id:'A',justification:'hypothesis:A'}] as DeclaredFailure[]),/probability required/);
  assert.throws(()=>unionBoundConfidence([{id:'A',p:'1/10',justification:''}]),/justification reference required/);
  assert.throws(()=>unionBoundConfidence([declaration('A','1/10'),declaration('A','1/10')]),/duplicate failure identity/);
  assert.throws(()=>unionBoundConfidence([declaration('A','2')]),/probability outside/);
  // Two declarations of certain failure still give zero despite their agreement.
  assert.deepEqual(unionBoundConfidence([declaration('A','1'),declaration('B','1')]).value,{numerator:'0',denominator:'1'});
  // A hole is a missing declaration, not the empty family of events.
  assert.throws(()=>unionBoundConfidence(new Array<DeclaredFailure>(1)),/failure identity required/);
});

test('T18 holds exactly for every triple of events on a nonuniform four-atom space',()=>{
  const weights=[1,2,3,4];
  const mass=(event:number)=>weights.reduce((sum,weight,atom)=>sum+((event&(1<<atom))?weight:0),0);
  for(let a=0;a<16;a++)for(let b=0;b<16;b++)for(let c=0;c<16;c++){
    const events=[a,b,c],sum=events.reduce((total,event)=>total+mass(event),0);
    const result=unionBoundConfidence(events.map((event,i)=>declaration(String(i),mass(event)+'/10')));
    const expected=Math.max(0,10-sum);
    assert.equal(BigInt(result.value.numerator)*10n,BigInt(expected)*BigInt(result.value.denominator));
    const actualSuccess=10-mass(a|b|c);
    assert.ok(BigInt(actualSuccess)*BigInt(result.value.denominator)>=BigInt(result.value.numerator)*10n);
    assert.equal(result.trivial,sum>=10);
  }
});

test('T18 can be sharp under dependence; an independence product can overstate success',()=>{
  // On atom weights (1,2,3,4), A={0,1}, B={2} are disjoint failures,
  // both of mass 3/10: all succeed with probability 4/10, not (7/10)^2.
  const result=unionBoundConfidence([declaration('A','3/10'),declaration('B','3/10')]);
  assert.deepEqual(result.value,{numerator:'2',denominator:'5'});
  assert.ok(4n*100n<49n*10n);
  // If both failures instead name the same event, success is 7/10; the
  // same union bound remains valid but is no longer tight.
  assert.ok(7n*BigInt(result.value.denominator)>=10n*BigInt(result.value.numerator));
});
