import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate} from './support/linage-rest-reader.ts';
const sample=JSON.parse(readFileSync(new URL('../samples/laws/linage-rest/yes.json',import.meta.url),'utf8'));
test('Helly: all pair witnesses exist while the global witness is absent',()=>{
 const h=evaluate(sample)['helly-comb'];assert.deepEqual(h.pairs.map(p=>p.intersection),[[1],[0],[2]]);assert.deepEqual(h.triple,[]);
});
test('H1: increasing sample is not a universal bound; diagnostic decrease and floor/ceiling failures retained',()=>{
 const r=evaluate(sample)['resolution-encounters'];assert.equal(r.historicalProductsMonotone,true);assert.equal(r.countertables[0].monotone,false);assert.equal(r.countertables[1].floorHolds,false);assert.equal(r.countertables[1].ceilingHolds,false);assert.equal(r.universalBound,false);
});
test('Coordination: exact enumeration agrees with formula and published fitting slice; countermodels remain distinguishable',()=>{
 const c=evaluate(sample).coordination;assert.equal(c.rows.length,6);assert.ok(c.rows.every((r:any)=>r.exactEnumerationMatches));assert.equal(c.existingFit.status,'measured');
 assert.deepEqual(c.existingFit.compatible![0]!.c,{lo:{numerator:'1',denominator:'4'},hi:{numerator:'1',denominator:'4'}});
 assert.equal(c.degeneracies.binaryPrivatePerfectlyCorrelated.actualUnanimity,'1');assert.equal(c.degeneracies.binaryPrivatePerfectlyCorrelated.iidUnanimity,'1/4');
 assert.deepEqual(c.degeneracies.twoPartialCauses.allSourceUnanimity,{numerator:'49',denominator:'64'});
 assert.equal(c.existingFit.identification.status,'unmeasured');assert.equal(c.existingFit.uncertainty.status,'unmeasured');
});
test('undeclared joint independence is rejected',()=>{const bad=structuredClone(sample);delete bad.coordination.privateJoint;assert.throws(()=>evaluate(bad),/joint-conditional-independence-required/);});
