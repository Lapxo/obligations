import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mixProjectionLoss,type MixLossModel} from '../../src/measures/mix-loss.ts';
const sample=JSON.parse(readFileSync(new URL('../../samples/measures/l9-mix-loss.json',import.meta.url),'utf8'));
const policy={logarithm:'binary64-log2' as const,budget:'100'};
test('L9: one mix tie hides two named forks; uniform mean loss is half a bit',()=>{
  const before=JSON.stringify(sample.yes),r=mixProjectionLoss(sample.yes.model,policy);
  assert.equal(r.status,'measured');if(r.status!=='measured')return;
  assert.equal(r.configurationBits,2);assert.equal(r.mixBits,1.5);assert.equal(r.lossBits,.5);
  assert.equal(r.entropyDifferenceBits,.5);assert.equal(r.forkLossBits,0);
  const tie=r.outputs.find(o=>o.output.kind==='tie')!;
  assert.equal(tie.conditionalBits,1);assert.deepEqual(tie.probability,{numerator:'1',denominator:'2'});
  assert.deepEqual(r.configurations[1]!.mix,r.configurations[2]!.mix);
  assert.notDeepEqual(r.configurations[1]!.fork,r.configurations[2]!.fork);
  assert.equal(r.mixInjectiveOnConfigurations,false);assert.equal(JSON.stringify(sample.yes),before);
  assert.notEqual(Math.log2(4/3),r.lossBits);
});
test('L9: missing prior stays unmeasured, invalid declared priors refuse by name',()=>{
  const {prior,...without}=sample.yes.model;
  assert.deepEqual(mixProjectionLoss(without,policy).status,'unmeasured');
  assert.throws(()=>mixProjectionLoss(sample.no.model,policy),/REFUSE·mix-loss prior probabilities must sum exactly to one/);
  assert.throws(()=>mixProjectionLoss({...without,prior:{kind:'explicit',probabilities:[null,null,null,null]}} as unknown as MixLossModel,policy),/REFUSE·mix-loss one prior probability/);
  assert.throws(()=>mixProjectionLoss({...without,prior:{kind:'explicit',probabilities:[]}},policy),/REFUSE·mix-loss one prior probability/);
});
test('L9: support and prior affect loss; zero mass does not imply global injectivity',()=>{
  const model={...sample.yes.model,prior:{kind:'explicit',probabilities:['aa','ab','ba','bb'].map((configuration,i)=>({configuration,p:i===1?'1':'0'}))}};
  const r=mixProjectionLoss(model,policy);assert.equal(r.status,'measured');if(r.status!=='measured')return;
  assert.equal(r.lossBits,0);assert.equal(r.mixInjectiveOnConfigurations,false);
  assert.equal(r.mixInjectiveOnPositiveSupport,true);assert.ok(r.outputs.some(o=>o.conditionalBits===null));
  const narrow={...sample.yes.model,configurations:sample.yes.model.configurations.slice(0,2)};
  const n=mixProjectionLoss(narrow,policy);assert.equal(n.status,'measured');if(n.status==='measured')assert.equal(n.lossBits,0);
});
test('L9: constant winners may lose information and weight rescaling adds none',()=>{
  const model={...sample.yes.model,factors:[{id:'x',weight:'2'},{id:'y',weight:'1'}],configurations:sample.yes.model.configurations.slice(0,2)};
  const r=mixProjectionLoss(model,policy);assert.equal(r.status,'measured');if(r.status!=='measured')return;
  assert.equal(r.lossBits,1);assert.equal(r.mixBits,0);
  const scaled=mixProjectionLoss({...model,factors:[{id:'x',weight:'4'},{id:'y',weight:'2'}]},policy);
  assert.equal(scaled.status,'measured');if(scaled.status==='measured')assert.equal(scaled.lossBits,r.lossBits);
});
test('L9: named value tie and bottom tie remain distinct; aliases cannot inflate configuration entropy',()=>{
  const model={...sample.yes.model,alphabet:['tie','b'],configurations:sample.yes.model.configurations.map((c:{id:string;values:string[]})=>({...c,values:c.values.map(v=>v==='a'?'tie':v)}))};
  const r=mixProjectionLoss(model,policy);assert.equal(r.status,'measured');if(r.status==='measured')assert.equal(r.lossBits,.5);
  assert.throws(()=>mixProjectionLoss({...sample.yes.model,configurations:[...sample.yes.model.configurations,{id:'alias',values:['a','a']}]},policy),/duplicate named-factor configuration/);
  assert.throws(()=>mixProjectionLoss({...sample.yes.model,factors:[{id:'x',weight:'0'},{id:'y',weight:'0'}]},policy),/positive total/);
});
test('L9: explicit logarithm policy and configuration ceiling are retained',()=>{
  const r=mixProjectionLoss(sample.yes.model,{...policy,budget:'3'});assert.equal(r.status,'unmeasured');
  if(r.status==='unmeasured'&&r.cause==='mix-loss/work-budget'){assert.equal(r.required,'4');assert.equal(r.workUnit,'declared-configurations');}
  assert.throws(()=>mixProjectionLoss(sample.yes.model,{...policy,logarithm:'implicit'} as never),/logarithm and work budget/);
});
