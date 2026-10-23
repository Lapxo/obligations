import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{validate}from'./support/finite-countermodels-reader.ts';
const source=()=>new Map([['vectors/laws/finite-countermodels.json',fs.readFileSync(new URL('../vectors/laws/finite-countermodels.json',import.meta.url),'utf8')]]);
for(const place of ['reservoir','shipping']){
 const base=()=>({profile:'analytic-countermodel-reading@1',place,provenance:'analytic-fixed-not-campaign',promoteReportedEvidence:false,universalNBound:false,universalScalarImpossibility:false});
 test(place+': explicit finite countermodels reuse public functions',()=>assert.equal(validate(base(),source()).experiments,0));
 for(const flag of ['promoteReportedEvidence','universalNBound','universalScalarImpossibility'])test(place+': refuses '+flag,()=>assert.throws(()=>validate({...base(),[flag]:true},source()),/unproved-promotion/));
 test(place+': refuses changed certificate',()=>{const f=source(),x=JSON.parse(f.values().next().value!);x.models.gls.certificates[0].magnitude={numerator:'1',denominator:'1'};f.set('vectors/laws/finite-countermodels.json',JSON.stringify(x));assert.throws(()=>validate(base(),f),/gls-positive-definite/)});
}
