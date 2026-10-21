import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate as measure} from './support/region-measure-reader.ts';
import {evaluate as provenance} from './support/key-lineage-reader.ts';

for(const place of ['reservoir','shipping']) {
  test(place+' executable region vectors accept and reject by the declared cause',()=>{
    const sample=(kind:string)=>JSON.parse(readFileSync(new URL('../samples/laws/region-measure/'+kind+'/'+place+'.json',import.meta.url),'utf8'));
    assert.equal(measure(sample('yes')).status,'measured');
    assert.throws(()=>measure(sample('no')),/region-measure\/unknown-atom/);
  });
  test(place+' executable provenance vectors reject a false independence reading',()=>{
    const sample=(kind:string)=>JSON.parse(readFileSync(new URL('../samples/laws/key-lineage-independence/'+kind+'/'+place+'.json',import.meta.url),'utf8'));
    assert.equal(provenance(sample('yes')).sharedInformationBits,1);
    assert.throws(()=>provenance(sample('no')),/key-lineage\/countermodel/);
  });
}
