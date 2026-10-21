import {test} from 'node:test';
import assert from 'node:assert/strict';
import {marginalInformation,type MarginalModel} from '../src/measures/marginal-information.ts';

function model(shared: boolean,lineage: string): MarginalModel {
  const rows=shared?[[0,0],[1,1]]:[[0,0],[0,1],[1,0],[1,1]];
  return {model:'finite-declared-joint@1',truthValues:['0','1'],sources:[{id:'key-b',lineage,values:['0','1']}],
    atoms:rows.map(([x,y],i)=>({id:String(i),truth:String(x),values:{'key-b':String(y)},p:shared?'1/2':'1/4'}))};
}
function information(shared:boolean,lineage:string){
  const result=marginalInformation(model(shared,lineage),[['key-b']],{logarithm:'binary64-log2',budget:'100'});
  if(result.status!=='measured')throw Error('missing measurement');
  return result.readings[0]!.totalInformation;
}
for(const place of ['reservoir','shipping']) {
  test(place+' two identifiers and identical labels permit dependent and independent laws',()=>{
    const metadata={keys:['key-a','key-b'],groups:['declared-a','declared-b']};
    assert.equal(new Set(metadata.keys).size,2);
    assert.equal(new Set(metadata.groups).size,2);
    assert.equal(information(true,'declared-b'),1);
    assert.equal(information(false,'declared-b'),0);
    assert.equal(information(true,'shared-control'),information(true,'different-label'));
    assert.equal(information(false,'shared-control'),information(false,'different-label'));
  });
  test(place+' common control and duplicated authorization labels do not create independent causes',()=>{
    const keys=['key-a','key-a','key-b'],control=new Map([['key-a','one-controller'],['key-b','one-controller']]);
    assert.equal(new Set(keys).size,2);
    assert.equal(new Set(keys.map(k=>control.get(k))).size,1);
    // This is the declared grouping, not a causal estimator or a signature check.
    assert.equal(information(true,'one-controller'),1);
  });
}
