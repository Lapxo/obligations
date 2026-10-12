import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coincidenceExcess,type ValueReading,type TruthReading,type CoincidenceReference} from '../../src/measures/coincidence.ts';
import {errorCovariance} from '../../src/measures/error-events.ts';
const values=Array.from({length:64},(_,i)=>String(i));
const policy={minEvents:1,minEventsPerTruth:1,budget:'100000'};
const reference:CoincidenceReference={model:'independent-uniform-wrong@1',values,marginals:'handed',
  errors:['a','b','c'].map(origin=>({origin,probability:'1/2'}))};
function fixture(xor:boolean){
  const rows:ValueReading[]=[],truth:TruthReading[]=[];
  for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<(xor?1:2);c++){
    const event=String(truth.length);truth.push({event,value:'0',kind:'truth'});
    [a,b,xor?a^b:c].forEach((error,i)=>rows.push({event,origin:['a','b','c'][i]!,value:error?'1':'0'}));
  }
  return {rows,truth};
}
test('equal pair marginals hide XOR dependence; signed coincidence excess keeps the triple deficit',()=>{
  const x=fixture(true),ind=fixture(false);
  const pair={...reference,errors:reference.errors.slice(0,2)};
  const a=coincidenceExcess(x.rows,x.truth,['a','b'],pair,policy);
  const b=coincidenceExcess(ind.rows,ind.truth,['a','b'],pair,policy);
  assert.equal(a.status,'measured');assert.equal(b.status,'measured');
  if(a.status==='measured'&&b.status==='measured'){
    assert.deepEqual(a.observed,b.observed);assert.deepEqual(a.ratio,{status:'measured',value:{numerator:'63',denominator:'1'}});
  }
  const triple=coincidenceExcess(x.rows,x.truth,['a','b','c'],reference,policy);
  assert.equal(triple.status,'measured');
  if(triple.status==='measured'){
    assert.deepEqual(triple.ratio,{status:'measured',value:{numerator:'0',denominator:'1'}});
    assert.deepEqual(triple.delta,{numerator:'-1',denominator:'31752'});
  }
});
test('uniform independent wrong values exactly match the declared reference',()=>{
  const rows:ValueReading[]=[],truth:TruthReading[]=[];
  for(let a=1;a<64;a++)for(let b=1;b<64;b++){
    const event=String(truth.length);truth.push({event,value:'0',kind:'truth'});
    rows.push({event,origin:'a',value:String(a)},{event,origin:'b',value:String(b)});
  }
  const r={...reference,errors:['a','b'].map(origin=>({origin,probability:'1'}))};
  const result=coincidenceExcess(rows,truth,['a','b'],r,policy);
  assert.equal(result.status,'measured');
  if(result.status==='measured')assert.deepEqual(result.ratio,{status:'measured',value:{numerator:'1',denominator:'1'}});
});
test('independent events with nonuniform labels exceed the uniform reference without proving a cause',()=>{
  const data=fixture(false);
  const covariance=errorCovariance(data.rows.map(row=>({event:row.event,origin:row.origin,error:(row.value==='0'?0:1) as 0|1})),{minCells:2});
  assert.equal(covariance.status,'measured');
  if(covariance.status==='measured')assert.deepEqual(covariance.matrix,[[.25,0,0],[0,.25,0],[0,0,.25]]);
  const result=coincidenceExcess(data.rows,data.truth,['a','b','c'],reference,policy);
  assert.equal(result.status,'measured');
  if(result.status==='measured'){
    assert.deepEqual(result.ratio,{status:'measured',value:{numerator:'3969',denominator:'1'}});
    assert.match(result.interpretation,/not causal/);
  }
});
test('redelivery and ordering add no event; conflicting values refuse; inputs stay unchanged',()=>{
  const x=fixture(true),before=JSON.stringify(x);
  const baseline=coincidenceExcess(x.rows,x.truth,['a','b','c'],reference,policy);
  assert.deepEqual(coincidenceExcess([...x.rows,...x.rows].reverse(),[...x.truth,...x.truth].reverse(),['c','b','a'],reference,policy),baseline);
  assert.equal(JSON.stringify(x),before);
  assert.throws(()=>coincidenceExcess([...x.rows,{...x.rows[0]!,value:'2'}],x.truth,['a','b','c'],reference,policy),/conflicting value/);
});
test('absence, zero reference and insufficient budget are distinct, never inferred independence',()=>{
  const x=fixture(true),pair={...reference,errors:['a','b'].map(origin=>({origin,probability:'0'}))};
  const zero=coincidenceExcess(x.rows,x.truth,['a','b'],pair,policy);
  assert.equal(zero.status,'measured');if(zero.status==='measured')assert.equal(zero.ratio.status,'unmeasured');
  assert.equal(coincidenceExcess(x.rows,[],['a','b','c'],reference,policy).status,'unmeasured');
  assert.equal(coincidenceExcess(x.rows,x.truth,['a','b','c'],reference,{...policy,budget:'0'}).status,'unmeasured');
  assert.throws(()=>coincidenceExcess(x.rows,x.truth,['a','a'],reference,policy),/invalid selection/);
});
test('estimated marginals condition on truth rather than pooling distinct populations',()=>{
  const rows:ValueReading[]=[],truth:TruthReading[]=[];
  for(let t=0;t<2;t++)for(let j=0;j<4;j++){
    const event=t+'-'+j;truth.push({event,value:String(t),kind:'truth'});
    ['a','b'].forEach(origin=>rows.push({event,origin,value:t?'2':'0'}));
  }
  const result=coincidenceExcess(rows,truth,['a','b'],{model:'independent-uniform-wrong@1',values:['0','1','2'],marginals:'estimated-by-truth'},policy);
  assert.equal(result.status,'measured');if(result.status==='measured')assert.deepEqual(result.expected,{numerator:'1',denominator:'4'});
});
