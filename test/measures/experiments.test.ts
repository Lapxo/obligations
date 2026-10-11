import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dissentExperiment,interestExperiment} from '../../src/measures/experiments.ts';

test('T5 reference stream reproduces model counts without claiming certification',()=>{
 const model={c:.2,p:.2,n:64},policy={seed:123456789,trials:80000};
 const result=dissentExperiment(model,16,policy);
 assert.deepEqual(result,dissentExperiment(model,16,policy));
 assert.equal(result.majorityWithDissent.falseEvents,0);
 assert.ok(typeof result.unanimity.rate==='number'&&Math.abs(result.unanimity.rate-.8988036998112685)<.02);
 const noisy=dissentExperiment({c:0,p:.8,n:2},4,{seed:12345,trials:2000});
 assert.ok(noisy.majorityWithDissent.falseEvents>0,'dissent is not a general certificate');
});
test('interest is an explicit controlled bias within the reference model',()=>{
 const model={c:0,p:.2,n:64},policy={seed:345678,trials:20000};
 const neutral=interestExperiment(model,0,false,policy),shared=interestExperiment(model,.9,true,policy),distinct=interestExperiment(model,.9,false,policy);
 assert.ok(typeof neutral.rate==='number'&&neutral.rate<.002);
 assert.ok(typeof shared.rate==='number'&&shared.rate>.03&&shared.rate<.07);
 assert.ok(typeof distinct.rate==='number'&&distinct.rate<.003);
 assert.deepEqual(shared,interestExperiment(model,.9,true,policy));
 assert.throws(()=>interestExperiment(model,2,true,policy),/interest bias/);
 assert.throws(()=>dissentExperiment(model,2,{seed:0,trials:10}),/seed/);
});
