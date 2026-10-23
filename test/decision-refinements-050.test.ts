import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{validate}from'./support/decision-refinements-reader.ts';
const sample=(p:string,k='yes')=>JSON.parse(fs.readFileSync(new URL('../samples/laws/decision-refinements/'+k+'/'+p+'.json',import.meta.url),'utf8'));
for(const place of ['reservoir','shipping']){
 test(place+': named loss, ties and decoder preserve distinct meanings',()=>{const x=sample(place),r=validate(x);assert.equal(r.status,'conditional-refinements-confirmed');assert.equal(r.experiments,0);assert.deepEqual(r.estimate.prior,x.loss.prior);assert.equal(r.loss[2]!.minimizers.length,2);assert.equal(r.cases[0]!.plurality.accuracy.numerator,'0')});
 test(place+': native negative refuses its named cause',()=>assert.throws(()=>validate(sample(place,'no')),new RegExp(place==='reservoir'?'no-universal-estimation-threshold':'decoder-required')));
 const mutations:[string,(x:any)=>void][]=[['model',x=>delete x.modelFamily],['loss',x=>x.loss.losses=[]],['prior',x=>x.loss.prior=['1','1']],['tie',x=>x.loss.tie='pick-first'],['threshold product',x=>x.threshold.cases[0].jointLaw='pairwise-only'],['threshold proof',x=>x.concentration='proved'],['asymptotic',x=>x.asymptoticClaim='proved-by-finite-cases'],['rule',x=>x.capacity.rules[0]='unknown'],['budget',x=>x.capacity.policy.budget='0'],['family substitution',x=>x.capacity.model='M0'],['identity',x=>x.capacity.cases[1].id=x.capacity.cases[0].id]];
 for(const[name,mutate]of mutations)test(place+': rejects '+name,()=>{const x=sample(place);mutate(x);assert.throws(()=>validate(x))});
}
