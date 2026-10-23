import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate,validate} from './support/foundation-reader.ts';
const regions=['cell-declaration','declaration-provenance','valuation-residual'];
const causes=['widening-travels','withdrawal-unnamed','valuation-data-processing'];
const fixture=(region:string,kind:string,place:string)=>JSON.parse(readFileSync(new URL(`../samples/laws/${region}/${kind}/${place}.json`,import.meta.url),'utf8'));
for(const place of ['reservoir','shipping'])for(const [i,region] of regions.entries()){
 test(`${place}/${region}: declared positive and named negative`,()=>{
  const x=fixture(region,'yes',place),text=JSON.stringify(x);
  assert.deepEqual(validate(x),x.expected);assert.equal(JSON.stringify(x),text);
  assert.throws(()=>evaluate(fixture(region,'no',place)),new RegExp(causes[i]!));
 });
 test(`${place}/${region}: a false expected answer cannot pass`,()=>{
  const x=fixture(region,'yes',place);x.expected={};assert.throws(()=>validate(x),/answer-differs/);
 });
}
test('a projection cannot merge equal-valued authors or remove both on withdrawal',()=>{
 const x=fixture('declaration-provenance','yes','reservoir');
 assert.deepEqual(x.claims[0].span,x.claims[1].span);
 x.expected.after=[];assert.throws(()=>validate(x),/answer-differs/);
});
test('refining the cell keeps attributed claims, epoch and support',()=>{
 const x=fixture('cell-declaration','yes','shipping'),r=evaluate(x) as any;
 assert.deepEqual(r.refined.seen,x.cell.seen);assert.deepEqual(r.refined.restsOn,x.cell.restsOn);assert.equal(r.refined.epoch,x.cell.epoch);
});
test('finite valuation admissibility is explicit, normalized and budgeted',()=>{
 const x=fixture('valuation-residual','yes','reservoir');
 assert.throws(()=>evaluate({...x,workBudget:0}),/foundation\/budget/);
 assert.throws(()=>evaluate({...x,values:[1,1,1,1,2]}),/valuation-normalization/);
 assert.throws(()=>evaluate({...x,values:[0,2,1,1,1]}),/valuation-monotonicity/);
 assert.throws(()=>evaluate({...x,values:[0,1,1,1]}),/valuation-domain/);
});
test('model absence and an unsupported interpretation never produce a reading',()=>{
 assert.throws(()=>evaluate({}),/model-required/);assert.throws(()=>evaluate({profile:'foundation-reading@1',kind:'authority'}),/unsupported-reading/);
});

test('exact withdrawal requires distinct named claim identities, not equal values',()=>{
 const x=fixture('declaration-provenance','yes','reservoir');
 x.claims[1].id=x.claims[0].id;assert.throws(()=>evaluate(x),/claim-identity-required/);
 delete x.claims[0].id;assert.throws(()=>evaluate(x),/claim-identity-required/);
});

test('the entropy residual is positive and the entropy table is checked by the existing engine',()=>{
 const x=fixture('valuation-residual','yes','reservoir'),r=evaluate(x) as any;
 assert.ok(r.residual>0);assert.ok(Math.abs(r.residual-(1-x.values[3]))<1e-12);
 x.entropyTables[4]=['1/4','1/4','1/4','1/4'];assert.throws(()=>evaluate(x),/entropy-table-differs/);
});
