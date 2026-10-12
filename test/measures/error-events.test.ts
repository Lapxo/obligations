import {test} from 'node:test';
import assert from 'node:assert/strict';
import {errorCovariance as computeCovariance,errorMatrix,participationRatio,type ErrorEvent} from '../../src/measures/error-events.ts';

const errorCovariance=(rows:readonly ErrorEvent[])=>computeCovariance(rows,{minCells:2});
const observations=(values:readonly (readonly (0|1)[])[]):ErrorEvent[]=>values.flatMap((row,event)=>row.map((error,origin)=>({event:String(event),origin:String(origin),error})));
test('independent balanced errors and perfectly shared errors have different effective ranks',()=>{
  assert.equal(participationRatio(errorCovariance(observations([[0,0],[0,1],[1,0],[1,1]]))).status,'measured');
  assert.deepEqual(participationRatio(errorCovariance(observations([[0,0],[0,1],[1,0],[1,1]]))),{status:'measured',value:2});
  assert.deepEqual(participationRatio(errorCovariance(observations([[0,0],[1,1],[0,0],[1,1]]))),{status:'measured',value:1});
});
test('redelivery and declaration order add neither observations nor origins',()=>{
  const rows=observations([[0,1],[1,0],[0,0]]);
  assert.deepEqual(errorCovariance([...rows,...rows].reverse()),errorCovariance(rows));
  assert.throws(()=>errorCovariance([...rows,{...rows[0]!,error:1}]),/conflicting error event/);
});
test('missing observations and no variation do not prove independence',()=>{
  assert.equal(errorCovariance([{event:'one',origin:'a',error:0}]).status,'unmeasured');
  assert.equal(errorCovariance([{event:'one',origin:'a',error:0},{event:'two',origin:'b',error:1}]).status,'unmeasured');
  assert.equal(participationRatio(errorCovariance(observations([[0,0],[0,0]]))).status,'unmeasured');
});

test('population covariance is normalized by the observed event population',()=>{
 const result=errorCovariance(observations([[0,0],[1,1]]));
 assert.equal(result.status,'measured');
 if(result.status==='measured')assert.deepEqual(result.matrix,[[.25,.25],[.25,.25]]);
 assert.equal(computeCovariance(observations([[0,0],[1,1]]),{minCells:20}).status,'unmeasured');
 assert.equal(errorMatrix(observations([[0,0],[1,1]]),{minCells:2},['absent']).status,'unmeasured');
 assert.throws(()=>computeCovariance([],{minCells:0}),/invalid minimum/);
});
test('malformed runtime inputs refuse by name rather than leaking NaN or a platform exception',()=>{
 assert.throws(()=>errorMatrix([],null as unknown as {minCells:number}),/REFUSE·measure/);
 assert.throws(()=>errorMatrix([null] as unknown as ErrorEvent[],{minCells:2}),/REFUSE·measure/);
 assert.throws(()=>participationRatio({status:'measured',origins:['a'],events:[],matrix:[[NaN]]}),/invalid covariance/);
 assert.throws(()=>participationRatio({status:'measured',origins:['a','b'],events:[],matrix:[[1,2],[0,1]]}),/nonsymmetric/);
});
