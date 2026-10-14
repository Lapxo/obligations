import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
  const vector=JSON.parse(readFileSync(new URL('../../vectors/measures/t12/expected.json',import.meta.url),'utf8'));
  for(const {n,c,q,bits} of vector.values)near(commonCauseCapacityBound(n,c,q,policy).value,bits);
  const samples=JSON.parse(readFileSync(new URL('../../samples/measures/t12/common-cause.json',import.meta.url),'utf8'));
  near(commonCauseCapacityBound(samples.yes.n,samples.yes.c,samples.yes.q,samples.yes.policy).value,samples.yes.expectedBits);
  assert.throws(()=>commonCauseCapacityBound(samples.no.n,samples.no.c,samples.no.q,samples.no.policy),/accuracy q required/);
  near(commonCauseCapacityBound(2,'1','0',policy).value,1); // invertible all-wrong binary channel
});
test('T12 copying one symmetric channel preserves joint-table mutual information',()=>{
  // Uniform T: each diagonal joint mass is 1/8; each off-diagonal is 1/24.
  // Duplicate the observed symbol, not the event mass: Y -> (Y,...,Y).
  function information(copies:number,diagonal:number,offDiagonal:number){
    const joint=Array.from({length:4},(_,truth)=>Array.from({length:4},(_,signal)=>({
      truth,output:Array(copies).fill(signal).join(','),mass:truth===signal?diagonal:offDiagonal,
    }))).flat();
    const truthMass=new Map<number,number>(),outputMass=new Map<string,number>();
    for(const event of joint){
      truthMass.set(event.truth,(truthMass.get(event.truth)??0)+event.mass);
      outputMass.set(event.output,(outputMass.get(event.output)??0)+event.mass);
    }
    near([...truthMass.values()].reduce((a,b)=>a+b,0),1);
    assert.equal(outputMass.size,4);
    return joint.reduce((sum,event)=>sum+event.mass*Math.log2(
      event.mass/(truthMass.get(event.truth)!*outputMass.get(event.output)!)),0);
  }
  const expected=0.20751874963942196;
  for(const copies of [1,2,20]){
    const symmetric=information(copies,1/8,1/24);
    near(symmetric,expected);
    near(symmetric,commonCauseCapacityBound(4,'1','1/2',policy).value);
    // q=1/4: every joint outcome has mass 1/16, even with identical copy counts.
    near(information(copies,1/16,1/16),0);
  }
  near(commonCauseCapacityBound(4,'1','1/4',policy).value,0);
  assert.notEqual(commonCauseCapacityBound(4,'1','1/2',policy).value,
    capacityBound(4,'1',policy).value);
});
test('T12 q is mandatory only on the new symmetric-cause operation',()=>{
  assert.throws(()=>commonCauseCapacityBound(4,'1/5',undefined as unknown as RationalInput,policy),/accuracy q required/);
  assert.throws(()=>commonCauseCapacityBound(4,'1/5','3/2',policy),/probability outside/);
  assert.throws(()=>commonCauseCapacityBound(4,'1/5','1/2',{} as typeof policy),/policy required/);
  near(capacityBound(4,'1/5',policy).value,1.6830074998557687);
});
