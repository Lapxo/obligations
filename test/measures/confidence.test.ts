import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unionBoundConfidence,type DeclaredFailure} from '../../src/measures/confidence.ts';
const declaration=(id:string,p:string)=>({id,p,justification:`hypothesis:${id}`});
test('T18 exact union-bound; no independence premise',()=>{
  const failures=[declaration('A','1/10'),declaration('B','1/5')],before=JSON.stringify(failures);
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
  assert.deepEqual(unionBoundConfidence([]).value,{numerator:'1',denominator:'1'});
});
test('T18 agreement cannot replace missing probabilities or justification',()=>{
  assert.throws(()=>unionBoundConfidence([{id:'A',justification:'hypothesis:A'}] as DeclaredFailure[]),/probability required/);
  assert.throws(()=>unionBoundConfidence([{id:'A',p:'1/10',justification:''}]),/justification reference required/);
  assert.throws(()=>unionBoundConfidence([declaration('A','1/10'),declaration('A','1/10')]),/duplicate failure identity/);
  assert.throws(()=>unionBoundConfidence([declaration('A','2')]),/probability outside/);
  // Two declarations of certain failure still give zero despite their agreement.
  assert.deepEqual(unionBoundConfidence([declaration('A','1'),declaration('B','1')]).value,{numerator:'0',denominator:'1'});
});
