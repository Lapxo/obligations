import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unanimityExperiment} from '../support/unanimity-experiment.ts';
import {fitUnanimityModel} from '../../src/measures/unanimity-fit.ts';
import {rational} from '../../src/measures/rational.ts';
test('three declared simulated lineages retain their generating parameters inside compatible slices',()=>{
 for(const [c,p,seed] of [['1/20','1/5',1729],['1/5','3/10',2718],['0','1/5',31415]] as const){
  const procedure={model:'single-dominant-factor@1' as const,n:64,c,p,lineage:c+':'+p,sizes:[2,4,8,16,32],
    prng:'xorshift32' as const,seed,trials:2000,randomWords:200000};
  const experiment=unanimityExperiment(procedure);assert.equal(experiment.status,'measured');
  if(experiment.status!=='measured')continue;
  const result=fitUnanimityModel(experiment.curve,{procedure:'exact-c-slices-on-declared-p-grid@1',p:['0','1/5','3/10','1/2','1'],
    tolerance:'3/100',budget:'1000000',bootstrap:{B:0,seed:1,prng:'xorshift32',randomWords:0}});
  assert.ok('compatible' in result);
  if('compatible' in result){
    const target=rational(p),slice=result.compatible.find(slice=>slice.p.numerator===String(target[0])&&slice.p.denominator===String(target[1]));
    assert.ok(slice,'generating p slice missing');
    const truth=rational(c),lo=rational(slice.c.lo),hi=rational(slice.c.hi);
    assert.ok(truth[0]*lo[1]>=lo[0]*truth[1]&&truth[0]*hi[1]<=hi[0]*truth[1],'generating c outside declared tolerance');
  }
  assert.deepEqual(experiment,unanimityExperiment(procedure));
 }
});
test('the controlled procedure never publishes partial curves after a budget failure',()=>{
 const result=unanimityExperiment({model:'single-dominant-factor@1',n:64,c:'1/5',p:'1/5',lineage:'one',sizes:[2,4,8],
  prng:'xorshift32',seed:1,trials:100,randomWords:1});
 assert.equal(result.status,'unmeasured');assert.ok(!('curve' in result));
});
