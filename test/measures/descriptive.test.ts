import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spectrum,commonMass,loadings,commonMassOf} from '../../src/measures/spectrum.ts';
import {unanimityFloor,unanimityThreshold,descentCount,modelRequired} from '../../src/measures/model.ts';
import {errorCovariance,participationRatio} from '../../src/measures/error-events.ts';
const policy={absolute:1e-12,relative:1e-10,maxRotations:1000};
const reading=(matrix:number[][])=>({status:'measured' as const,origins:matrix.map((_,i)=>String(i)),events:[],matrix});
function near(actual:number,expected:number,tolerance=1e-9){assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} vs ${expected}`);}

test('analytic eigensystem satisfies residual and orthogonality; inputs are unchanged',()=>{
 const input=reading([[1,1],[1,2]]),before=JSON.stringify(input),result=spectrum(input,policy);
 assert.equal(result.status,'measured');
 if(result.status==='measured'){
  near(result.values[0]!,(3+Math.sqrt(5))/2);near(result.values[1]!,(3-Math.sqrt(5))/2);
  near(result.vectors[0]!.reduce((sum,x,i)=>sum+x*result.vectors[1]![i]!,0),0);
  for(const vector of result.vectors)near(vector.reduce((sum,x)=>sum+x*x,0),1);
  assert.ok(result.residual<1e-9);
 }
 assert.equal(JSON.stringify(input),before);
});
test('repeated eigenvalues have no unique top loading; their full variance subspace remains readable',()=>{
 const result=spectrum(reading([[1,0],[0,1]]),policy);
 assert.deepEqual(commonMass(result),{status:'measured',value:.5});
 assert.equal(loadings(result).status,'unmeasured');
 assert.deepEqual(commonMassOf(result,['0','1'],.5),{status:'measured',value:1});
 assert.equal(commonMass(spectrum(reading([[0,0],[0,0]]),policy)).status,'unmeasured');
});
test('subset variance is descriptive, not a probability of error',()=>{
 const result=spectrum(reading([[3,0],[0,1]]),policy);
 assert.deepEqual(commonMassOf(result,['1'],.5),{status:'measured',value:0});
 assert.deepEqual(commonMassOf(result,['0','1'],.5),{status:'measured',value:.75});
 assert.equal(commonMassOf(result,['missing'],.5).status,'unmeasured');
 assert.equal(commonMassOf(result,['0','1'],1/3).status,'unmeasured');
});
test('invalid matrices refuse, and an insufficient numerical budget never claims a spectrum',()=>{
 assert.throws(()=>spectrum(reading([[1,2],[0,1]]),policy),/nonsymmetric/);
 assert.throws(()=>spectrum(reading([[1,2],[2,1]]),policy),/positive semidefinite/);
 assert.throws(()=>spectrum(reading([[NaN]]),policy),/invalid covariance/);
 assert.equal(spectrum(reading([[2,1,.8],[1,3,.7],[.8,.7,4]]),{...policy,maxRotations:1}).status,'unmeasured');
});
test('spectrum and trace participation ratios agree on handed error events',()=>{
 const rows=[[0,0],[0,1],[1,0],[1,1]].flatMap((row,event)=>row.map((error,origin)=>({event:String(event),origin:String(origin),error:error as 0|1})));
 const cov=errorCovariance(rows,{minCells:2}),result=spectrum(cov,policy),rank=participationRatio(cov);
 assert.equal(result.status,'measured');assert.equal(rank.status,'measured');
 if(result.status==='measured'&&rank.status==='measured')near(result.values.reduce((s,x)=>s+x,0)**2/result.values.reduce((s,x)=>s+x*x,0),rank.value);
});
test('T1 handles counterexample, degeneracies, and large counts without underflow misclassification',()=>{
 const model={c:.01,p:.1,n:2};
 assert.deepEqual(unanimityThreshold(model,10000),{status:'measured',value:3});
 const a=unanimityFloor(model,1),b=unanimityFloor(model,2);if(a.status==='measured'&&b.status==='measured')assert.ok(a.value>b.value);
 assert.deepEqual(unanimityFloor({c:.2,p:0,n:2},10000),{status:'measured',value:.2});
 assert.deepEqual(unanimityFloor({c:0,p:.5,n:2},10000),{status:'measured',value:.5});
 assert.deepEqual(unanimityFloor({c:0,p:.8,n:2},10000),{status:'measured',value:1});
 assert.equal(unanimityThreshold({c:0,p:.1,n:2},10000).status,'unmeasured');
 assert.equal(unanimityThreshold(model,2).status,'unmeasured');
 assert.throws(()=>unanimityFloor({...model,n:1},2),/invalid unanimity/);
});
test('descent counts distinct scopes, keeps absence unknown, and refuses cycles',()=>{
 const graph=[{scope:'a',restsOn:[]},{scope:'b',restsOn:['a','a']},{scope:'c',restsOn:['a','b']}];
 assert.deepEqual(descentCount(graph,'a'),{status:'measured',value:2});
 assert.deepEqual(descentCount(graph,'c'),{status:'measured',value:0});
 assert.equal(descentCount(graph,'absent').status,'unmeasured');
 assert.equal(descentCount([{scope:'a',restsOn:['absent']}],'a').status,'unmeasured');
 assert.throws(()=>descentCount([{scope:'a',restsOn:['b']},{scope:'b',restsOn:['a']}],'a'),/cyclic descent/);
 assert.equal(modelRequired('strength').status,'unmeasured');
});
