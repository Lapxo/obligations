import {test} from 'node:test';
import assert from 'node:assert/strict';
import {capacityBound,commonCauseCapacityBound} from '../../src/measures/capacity.ts';
import type {RationalInput} from '../../src/measures/rational.ts';
const policy={logarithm:'binary64-log2' as const};
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);
test('T12 covering symmetric cause: fixed independent entropy oracles and endpoints',()=>{
  for(const [c,q,expected] of [
    ['0','1/2',2],['1','0',0.4150374992788439],['1','1',2],
    ['1','1/2',0.20751874963942196],['1','1/4',0],
    ['1/5','0',1.6830074998557687],['1/5','1/2',1.6415037499278844],
  ] as const)near(commonCauseCapacityBound(4,c,q,policy).value,expected);
  near(commonCauseCapacityBound(2,'1','0',policy).value,1); // invertible all-wrong binary channel
});
test('T12 copies do not add: one shared signal is independent of its copy count',()=>{
  const baseline=commonCauseCapacityBound(4,'1/5','1/2',policy);
  for(const copies of [1,2,20]){
    const identicalSignals=Array(copies).fill('one-shared-channel');
    assert.equal(new Set(identicalSignals).size,1);
    assert.deepEqual(commonCauseCapacityBound(4,'1/5','1/2',policy),baseline);
  }
  assert.equal('k' in baseline.parameters,false);
  assert.notEqual(baseline.value,capacityBound(4,'1/5',policy).value);
});
test('T12 q is mandatory only on the new symmetric-cause operation',()=>{
  assert.throws(()=>commonCauseCapacityBound(4,'1/5',undefined as unknown as RationalInput,policy),/accuracy q required/);
  assert.throws(()=>commonCauseCapacityBound(4,'1/5','3/2',policy),/probability outside/);
  assert.throws(()=>commonCauseCapacityBound(4,'1/5','1/2',{} as typeof policy),/policy required/);
  near(capacityBound(4,'1/5',policy).value,1.6830074998557687);
});
