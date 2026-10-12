import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chain} from '../../src/lattice/order.ts';
import {unit,state} from '../../src/debit/unit.ts';
import {errorMatrix,covariance,participationRatio,spectrum,commonMass,loadings,commonMassOf,unanimityFloor,unanimityThreshold,descentCount,modelRequired,evaluateM3,probeUpdate,identifyM3,fitM3,experimentM3} from '../../src/measures/index.ts';
import {capacityBound,capacityP0,mutualInformation,unanimityNoFactor,decisionInformation,fitUnanimityModel,coincidenceExcess} from '../../src/measures/index.ts';

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
 const logarithms={logarithm:'binary64-log2' as const,budget:'1000'};
 capacityBound(4,'1/5',logarithms);capacityP0(4,'1/5',logarithms);
 mutualInformation(2,{n:4,c:'1/5',p:'3/10'},logarithms);
 unanimityNoFactor(2,4,'3/10',{budget:'1000'});
 decisionInformation(2,{n:4,c:'1/5',p:'3/10'},'posterior-map-uniform-ties@1',logarithms);
 fitUnanimityModel({n:4,lineage:'declared',counts:[{k:2,unanimous:1,trials:4},{k:4,unanimous:1,trials:8}]},
  {procedure:'exact-c-slices-on-declared-p-grid@1',p:['1/4'],tolerance:'1/10',budget:'1000',
   bootstrap:{B:0,seed:1,prng:'xorshift32',randomWords:0}});
 coincidenceExcess([{event:'one',origin:'a',value:'1'},{event:'one',origin:'b',value:'1'}],
  [{event:'one',value:'0',kind:'truth'}],['a','b'],
  {model:'independent-uniform-wrong@1',values:['0','1'],marginals:'handed',errors:[{origin:'a',probability:'1/2'},{origin:'b',probability:'1/2'}]},
  {minEvents:1,minEventsPerTruth:1,budget:'100'});
 assert.deepEqual(cells.map(cell=>state(scale,cell)),states);assert.equal(JSON.stringify(cells),before);
});
