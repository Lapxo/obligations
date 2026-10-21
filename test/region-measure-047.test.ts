import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finiteRegionMeasure, type RegionMeasure} from '@lapxo/obligations/measures';
import {add, equal, rational, sub} from '../src/measures/rational.ts';

const model = (prefix: string): RegionMeasure => ({model:'finite-nonnegative-atomic-valuation@1',unit:'declared-units',
  atoms:[{id:prefix+'a',value:'1/2'},{id:prefix+'b',value:'2'},{id:prefix+'c',value:'0'},{id:prefix+'unassigned',value:'1/3'}],
  regions:[{id:prefix+'left',members:[prefix+'a',prefix+'b']},{id:prefix+'right',members:[prefix+'c']}]});
const read = (input: RegionMeasure) => {
  const result=finiteRegionMeasure(input,{budget:'100'});
  if(result.status!=='measured')throw Error('missing measurement');
  return result;
};
for(const prefix of ['reservoir/','shipping/']) {
  test(prefix+' declared support, empty regions, redelivery and permutation',()=>{
    const input=model(prefix),result=read(input);
    assert.deepEqual(result.union.value,{numerator:'5',denominator:'2'});
    assert.equal(result.disjointBySupport,true);
    assert.deepEqual(result.unassigned,[prefix+'unassigned']);
    assert.deepEqual(read({...input,atoms:[...input.atoms].reverse(),regions:[...input.regions].reverse()}),result);
    const duplicate=read({...input,atoms:[...input.atoms,{id:prefix+'a',value:'2/4'}],regions:input.regions.map(r=>({...r,members:[...r.members,...r.members]}))});
    assert.deepEqual(duplicate.union,result.union);
    assert.deepEqual(duplicate.readings,result.readings);
    const empty=read({...input,regions:[{id:prefix+'empty',members:[]}]});
    assert.deepEqual(empty.readings[0]!.value,{numerator:'0',denominator:'1'});
    assert.equal(empty.unassigned.length,4);
  });
  test(prefix+' overlap witnesses do not assert lattice withdrawal',()=>{
    const input=model(prefix),shared=read({...input,regions:[{id:prefix+'one',members:[prefix+'a']},{id:prefix+'two',members:[prefix+'a']}]});
    assert.equal(shared.disjointBySupport,false);
    assert.deepEqual(shared.overlapExcess,{numerator:'1',denominator:'2'});
    const zero=read({...input,regions:[{id:'one',members:[prefix+'c']},{id:'two',members:[prefix+'c']}]});
    assert.equal(zero.disjointBySupport,false);
    assert.deepEqual(zero.overlapExcess,{numerator:'0',denominator:'1'});
    assert.equal('withdrawal' in shared,false);
  });
  test(prefix+' finite inclusion exclusion for all pairs of four-atom subsets',()=>{
    const input=model(prefix),ids=input.atoms.map(a=>a.id);
    const subsets=Array.from({length:16},(_,mask)=>ids.filter((_,i)=>mask&(1<<i)));
    for(const A of subsets)for(const B of subsets){
      const result=read({...input,regions:[{id:'A',members:A},{id:'B',members:B},{id:'intersection',members:A.filter(id=>B.includes(id))}]});
      const values=new Map(result.readings.map(r=>[r.region,rational(r.value)]));
      assert.ok(equal(add(values.get('A')!,values.get('B')!),add(rational(result.union.value),values.get('intersection')!)));
      // Three-region overlap excess includes the separately declared intersection.
      assert.ok(equal(rational(result.overlapExcess),sub(add(add(values.get('A')!,values.get('B')!),values.get('intersection')!),rational(result.union.value))));
    }
  });
}
test('named refusals and deterministic work budget',()=>{
  const input=model('x/');
  assert.throws(()=>read({...input,unit:''}),/region-measure\/model-and-unit/);
  assert.throws(()=>read({...input,atoms:[{id:'x',value:'-1'}]}),/negative-weight/);
  assert.throws(()=>read({...input,atoms:[...input.atoms,{id:'x/a',value:'2'}]}),/conflicting-atom/);
  assert.throws(()=>read({...input,atoms:[{id:'x',value:'1/0'}]}),/region-measure\/weight/);
  assert.throws(()=>read({...input,atoms:[{id:'x',value:'1',unit:'different-unit'} as unknown as RegionMeasure['atoms'][number]]}),/region-measure\/atom/);
  assert.throws(()=>read({...input,regions:[{id:'unknown',members:['absent']}]}),/unknown-atom/);
  assert.throws(()=>read({...input,regions:[input.regions[0]!,input.regions[0]!]}),/duplicate-region/);
  assert.throws(()=>read({...input,regions:[{id:'invalid',members:[null as unknown as string]}]}),/region-measure\/region/);
  assert.equal(finiteRegionMeasure(input,{budget:'0'}).status,'unmeasured');
  assert.throws(()=>finiteRegionMeasure(input,{budget:'-1'}),/region-measure\/budget/);
});
