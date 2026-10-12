import {test} from 'node:test';
import assert from 'node:assert/strict';
import {identifyM3,dissentCertificate,evaluateM3} from '../../src/measures/index.ts';
const policy={budget:'10000'};
test('population identification recovers exact shared survival without identifying private versus singleton error',()=>{
 const result=identifyM3({witnesses:[{id:'A',correct:'2/5'},{id:'B',correct:'1/2'}],factors:[{id:'shared',members:['A','B']},{id:'singleton',members:['A']}],pairs:[{a:'A',b:'B',correctTogether:'1/4'}]},policy);
 assert.equal(result.status,'identified');if(result.status!=='identified')return;
 assert.deepEqual(result.factors[0]!.probability,{numerator:'1',denominator:'5'});
 assert.deepEqual(result.residualSurvival.map(w=>w.r.rational),[{numerator:'1',denominator:'2'},{numerator:'5',denominator:'8'}]);
 assert.ok(result.residualSurvival.every(w=>w.privateSingletonDecomposition==='unresolved'));
});
test('rank, zero correctness, incompatible moments and budget retain unidentified or misfit outcomes',()=>{
 const base={witnesses:[{id:'A',correct:'0'},{id:'B',correct:'1/2'}],factors:[{id:'shared',members:['A','B']}],pairs:[{a:'A',b:'B',correctTogether:'0'}]};
 assert.equal(identifyM3(base,policy).status,'unmeasured');
 const positive={...base,witnesses:[{id:'A',correct:'2/5'},{id:'B',correct:'1/2'}],pairs:[{a:'A',b:'B',correctTogether:'1/4'}]};
 assert.equal(identifyM3({...positive,factors:[...positive.factors,{id:'same',members:['A','B']}]},policy).status,'unmeasured');
 assert.equal(identifyM3({...positive,pairs:[{a:'A',b:'B',correctTogether:'1/10'}]},policy).status,'unmeasured');
 assert.equal(identifyM3(positive,{budget:'0'}).status,'unmeasured');
});
test('general declared pair systems recover more than one factor and reject unexplained residuals',()=>{
 const result=identifyM3({witnesses:[{id:'A',correct:'4/5'},{id:'B',correct:'3/5'},{id:'C',correct:'3/4'}],factors:[{id:'ab',members:['A','B']},{id:'bc',members:['B','C']}],pairs:[{a:'A',b:'B',correctTogether:'3/5'},{a:'B',b:'C',correctTogether:'3/5'},{a:'A',b:'C',correctTogether:'3/5'}]},policy);
 assert.equal(result.status,'identified');if(result.status!=='identified')return;
 assert.deepEqual(result.factors.map(f=>f.probability),[{numerator:'1',denominator:'5'},{numerator:'1',denominator:'4'}]);
 assert.ok(result.residualSurvival.every(w=>w.r.rational?.numerator==='1'&&w.r.rational.denominator==='1'));
 const bad=identifyM3({...result.parameters,pairs:[...result.parameters.pairs.slice(0,2),{a:'A',b:'C',correctTogether:'2/3'}]},policy);
 assert.equal(bad.status,'unmeasured');
});
test('dissent certificate depends on actual ordered configuration, never on dissent alone',()=>{
 const model={cell:'x',cardinality:64,witnesses:['A','B','C'].map(id=>({id,privateError:'0'})),selection:['A','B','C'],factors:[{id:'partial',index:0,members:['A','B'],probability:'1/2'},{id:'cover',index:1,members:['A','B','C'],probability:'1/2'}]};
 assert.equal(dissentCertificate(model,['cover']).unanimityForced,true);assert.equal(dissentCertificate(model,['cover','partial']).unanimityForced,false);
 assert.throws(()=>dissentCertificate(model,['missing']),/configuration/);
 assert.throws(()=>evaluateM3({...model,witnesses:[{id:'A'},...model.witnesses.slice(1)]},{budget:'100'}),/absent for A/);
});
