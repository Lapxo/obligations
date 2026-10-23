import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validate} from './support/shared-causes-reader.ts';
const sample=(place:string,kind='yes')=>JSON.parse(fs.readFileSync(new URL('../samples/laws/shared-causes/'+kind+'/'+place+'.json',import.meta.url),'utf8'));
for(const place of ['reservoir','shipping']){
 test(place+': five fixed analytic boundaries preserve attribution',()=>{const x=sample(place),r=validate(x);assert.equal(r.status,'conditional-boundaries-confirmed');assert.equal(r.experiments,0);assert.equal(r.unknownIncidenceIdentification,'open');assert.deepEqual(r.known.parameters,x.known);assert.deepEqual(r.sharedChannel.sources,x.sharedChannel.sources);assert.equal(r.sharedChannel.declaredSharedSignals,1)});
 test(place+': requested unjustified inference refuses',()=>assert.throws(()=>validate(sample(place,'no')),new RegExp(place==='reservoir'?'cardinality-not-identification':'private-singleton-unresolved')));
 const mutations:[string,(x:any)=>void][]=[['family',x=>delete x.modelFamily],['unsupported topology identification',x=>x.scope.unknownIncidenceIdentification='identified'],['rank',x=>x.rankDeficient.factors.pop()],['pair',x=>x.samePairs.laws[1].atoms[0].p='1/4'],['conversion',x=>delete x.sharedChannel.similarityConversion],['missing state',x=>x.sharedChannel.atoms.pop()],['changed mass',x=>x.sharedChannel.atoms[0].p='1/2'],['channel noise',x=>x.sharedChannel.noiseFlip='0'],['private request',x=>x.request='resolve-private-from-moments'],['unknown request',x=>x.request='infer-topology'],['budget',x=>x.policy.budget='0']];
 for(const[name,change]of mutations)test(place+': refuses '+name,()=>{const x=sample(place);change(x);assert.throws(()=>validate(x))});
}
