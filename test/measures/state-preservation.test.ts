import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chain} from '../../src/lattice/order.ts';
import {unit,state} from '../../src/debit/unit.ts';
import {errorMatrix,covariance,participationRatio,spectrum,commonMass,loadings,commonMassOf,unanimityFloor,unanimityThreshold,descentCount,modelRequired,evaluateM3,probeUpdate,identifyM3,fitM3,experimentM3} from '../../src/measures/index.ts';

test('the actual four algebraic states and their cells survive every descriptive measure unchanged',()=>{
 const scale=chain(['off','on']);
 const cells=[unit('free',{floor:'off',ceiling:'on'}),unit('required',{floor:'on',ceiling:'on'}),unit('forbidden',{floor:'off',ceiling:'off'}),unit('conflict',{floor:'on',ceiling:'off'})];
 const before=JSON.stringify(cells),states=cells.map(cell=>state(scale,cell));
 assert.deepEqual(states,['FREE','REQUIRED','FORBIDDEN','CONFLICT']);
 cells.forEach(Object.freeze);Object.freeze(cells);
 const rows=[{event:'one',origin:'a',error:0 as const},{event:'one',origin:'b',error:0 as const},{event:'two',origin:'a',error:1 as const},{event:'two',origin:'b',error:1 as const}];
 const matrix=errorMatrix(rows,{minCells:2}),cov=covariance(matrix),spec=spectrum(cov,{absolute:1e-12,relative:1e-10,maxRotations:100});
 participationRatio(cov);commonMass(spec);loadings(spec);commonMassOf(spec,['a','b'],.5);
 unanimityFloor({c:.01,p:.1,n:2},2);unanimityThreshold({c:.01,p:.1,n:2},100);
 descentCount([{scope:'a',restsOn:[]},{scope:'b',restsOn:['a']}],'a');modelRequired('strength');
 const model={cell:'x',cardinality:2,witnesses:[{id:'a',privateError:'1/2'},{id:'b',privateError:'1/2'}],factors:[],selection:['a','b']};
 evaluateM3(model,{budget:'10'});probeUpdate('1/2','1/2',2);
 identifyM3({witnesses:[{id:'a',correct:'1/2'}],factors:[],pairs:[]},{budget:'10'});
 fitM3(rows,{factors:[]},{observation:{minCells:2},activeSets:'10',solveTolerance:1e-10,residualTolerance:1e-10,bootstrap:{B:0,seed:1,prng:'xorshift32',randomWords:0}});
 experimentM3(model,{prng:'xorshift32',seed:123,trials:10,randomWords:100});
 assert.deepEqual(cells.map(cell=>state(scale,cell)),states);assert.equal(JSON.stringify(cells),before);
});
