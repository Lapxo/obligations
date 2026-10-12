import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitM3,type ErrorEvent,type FitPolicy} from '../../src/measures/index.ts';
const policy:FitPolicy={observation:{minCells:2},activeSets:'10000',solveTolerance:1e-12,residualTolerance:1e-10,bootstrap:{B:8,seed:123456,prng:'xorshift32',randomWords:10000}};
const structure={factors:[{id:'shared',members:['A','B']}]};
const rows:ErrorEvent[]=[];
for(const [a,b,N] of [[0,0,10],[0,1,6],[1,0,10],[1,1,14]] as const)for(let i=0;i<N;i++){const event=String(rows.length);rows.push({event,origin:'A',error:a},{event,origin:'B',error:b});}
test('declared finite-data fit recovers shared log survival, records residuals and reproducible bootstrap, never Φ or D',()=>{
 const r=fitM3(rows,structure,policy);assert.equal(r.status,'fitted');if(r.status!=='fitted')return;
 assert.ok(Math.abs(r.factors[0]!.probability-.2)<1e-12);assert.ok(r.residualSumSquares<1e-20);
 assert.equal('phi' in r,false);assert.equal('D' in r,false);const reversed=fitM3([...rows].reverse(),structure,policy);assert.equal(reversed.status,'fitted');if(reversed.status==='fitted'){assert.deepEqual(r.factors,reversed.factors);assert.deepEqual(r.bootstrap,reversed.bootstrap);}
 assert.equal(r.bootstrap.status,'measured');assert.ok(r.residualSurvival.every(w=>w.privateSingletonDecomposition==='unresolved'));
});
test('zero joint counts, absent rank and insufficient resources never report fitted probabilities',()=>{
 const zero=[{event:'one',origin:'A',error:0 as const},{event:'one',origin:'B',error:1 as const},{event:'two',origin:'A',error:1 as const},{event:'two',origin:'B',error:0 as const}];
 const misfit=fitM3(zero,structure,policy);assert.equal(misfit.status,'unmeasured');assert.equal('factors' in misfit,false);
 assert.equal(fitM3(rows,{factors:[...structure.factors,{id:'duplicate-structure',members:['A','B']}]},policy).status,'unmeasured');
 assert.equal(fitM3(rows,structure,{...policy,activeSets:'0'}).status,'unmeasured');
 const r=fitM3(rows,structure,{...policy,bootstrap:{...policy.bootstrap,randomWords:0}});assert.equal(r.status,'fitted');if(r.status==='fitted')assert.equal(r.bootstrap.status,'unmeasured');
});
test('the same finite-data procedure identifies a declared overlapping two-factor system',()=>{
 const data:ErrorEvent[]=[];
 for(let bits=0;bits<32;bits++)for(let w=0;w<3;w++){
  const governed=(w<2&&(bits&1))||(w>0&&(bits&2));
  data.push({event:String(bits),origin:['A','B','C'][w]!,error:governed||(bits&(1<<(w+2)))?1:0});
 }
 const r=fitM3(data,{factors:[{id:'ab',members:['A','B']},{id:'bc',members:['B','C']}]},{...policy,bootstrap:{...policy.bootstrap,B:0}});
 assert.equal(r.status,'fitted');if(r.status==='fitted')assert.ok(r.factors.every(f=>Math.abs(f.probability-.5)<1e-12));
});
