import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitUnanimityModel,type UnanimityFitPolicy} from '../../src/measures/unanimity-fit.ts';
const policy:UnanimityFitPolicy={procedure:'exact-c-slices-on-declared-p-grid@1',p:['0','1/4','1/2','3/4','1'],
  tolerance:'0',budget:'100000',bootstrap:{B:0,seed:1,prng:'xorshift32',randomWords:0}};
test('an exact curve retains both binary parameter branches rather than fabricating identification',()=>{
  const curve={n:2,lineage:'one',counts:[{k:2,unanimous:5,trials:8},{k:3,unanimous:7,trials:16},{k:4,unanimous:41,trials:128}]};
  const result=fitUnanimityModel(curve,policy);
  assert.equal(result.status,'unmeasured');assert.ok('compatible' in result);
  if('compatible' in result){
    assert.deepEqual(result.compatible.map(slice=>slice.p),[{numerator:'1',denominator:'4'},{numerator:'3',denominator:'4'}]);
    result.compatible.forEach(slice=>assert.deepEqual(slice.c,{lo:{numerator:'0',denominator:'1'},hi:{numerator:'0',denominator:'1'}}));
  }
});
test('perfect unanimity keeps the whole compatible ambiguity and no causal result',()=>{
  const result=fitUnanimityModel({n:64,lineage:'one',counts:[{k:2,unanimous:10,trials:10},{k:4,unanimous:10,trials:10}]},policy);
  assert.equal(result.status,'unmeasured');if('compatible' in result){
    const zero=result.compatible.find(slice=>slice.p.numerator==='0');
    assert.deepEqual(zero?.c,{lo:{numerator:'0',denominator:'1'},hi:{numerator:'1',denominator:'1'}});
  }
});
test('paired-group bootstrap retains cross-size sampling dependence and is deterministic',()=>{
  const groups=[{id:'a',outcomes:[{k:2,unanimous:true},{k:4,unanimous:true}]},
    {id:'b',outcomes:[{k:2,unanimous:false},{k:4,unanimous:false}]},
    {id:'c',outcomes:[{k:2,unanimous:true},{k:4,unanimous:false}]}];
  const curve={n:4,lineage:'one',counts:[{k:2,unanimous:2,trials:3},{k:4,unanimous:1,trials:3}],groups};
  const p={...policy,tolerance:'1/4',bootstrap:{...policy.bootstrap,B:8,randomWords:100}};
  const result=fitUnanimityModel(curve,p);
  assert.deepEqual(result,fitUnanimityModel({...curve,groups:[...groups].reverse(),counts:[...curve.counts].reverse()},p));
  assert.ok('uncertainty' in result&&result.uncertainty.status==='measured');
  const exhausted=fitUnanimityModel(curve,{...p,bootstrap:{...p.bootstrap,randomWords:0}});
  assert.ok('uncertainty' in exhausted&&exhausted.uncertainty.status==='unmeasured');
});
test('counts alone do not invent sampling uncertainty; inconsistent paired outcomes refuse',()=>{
  const curve={n:4,lineage:'one',counts:[{k:2,unanimous:2,trials:3},{k:4,unanimous:1,trials:3}]};
  const result=fitUnanimityModel(curve,{...policy,tolerance:'1/4'});
  assert.ok('uncertainty' in result&&result.uncertainty.status==='unmeasured');
  assert.throws(()=>fitUnanimityModel({...curve,groups:[{id:'a',outcomes:[]}]},policy),/complete paired/);
  assert.equal(fitUnanimityModel(curve,{...policy,budget:'0'}).status,'unmeasured');
});
