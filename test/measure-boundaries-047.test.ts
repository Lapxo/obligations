import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finiteRegionMeasure} from '../src/measures/region-measure.ts';

test('selectors with a shared file do not justify adding counts',()=>{
  const got=finiteRegionMeasure({model:'finite-nonnegative-atomic-valuation@1',unit:'declared-lines',
    atoms:[{id:'one-file/line-1',value:'1'},{id:'one-file/line-2',value:'1'}],
    regions:[{id:'narrow',members:['one-file/line-1']},{id:'broad',members:['one-file/line-1','one-file/line-2']}]},{budget:'10'});
  if(got.status!=='measured')throw Error('missing measurement');
  assert.deepEqual(got.sumOfRegions,{numerator:'3',denominator:'1'});
  assert.deepEqual(got.union.value,{numerator:'2',denominator:'1'});
});

test('a declared deterministic tokenizer can merge across file boundaries',()=>{
  // This finite tokenizer is a countermodel, not a production tokenizer.
  const tokenizer=(s:string)=>s==='ab'?['ab']:Array.from(s);
  assert.equal(tokenizer('a').length+tokenizer('b').length,2);
  assert.equal(tokenizer('a'+'b').length,1);
});

test('parallel wall duration is not the sum of component durations',()=>{
  const intervals=[[0,3],[0,3]] as const;
  assert.equal(intervals.reduce((sum,[a,b])=>sum+b-a,0),6);
  assert.equal(Math.max(...intervals.map(x=>x[1]))-Math.min(...intervals.map(x=>x[0])),3);
});

test('one call event delivered twice is still one declared support element',()=>{
  const got=finiteRegionMeasure({model:'finite-nonnegative-atomic-valuation@1',unit:'declared-call-events',
    atoms:[{id:'call/1',value:'1'},{id:'call/1',value:'1'}],regions:[{id:'source',members:['call/1','call/1']}]},{budget:'10'});
  if(got.status!=='measured')throw Error('missing measurement');
  assert.deepEqual(got.union.value,{numerator:'1',denominator:'1'});
});
