import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observe} from '../support/measures-reader.ts';

for(const group of ['observations','spectrum','unanimity','descent','m3','capacity','decisions','unanimity-fit','coincidence']){
  test('the maintained '+group+' reader reproduces native captures and refusals',()=>{
    const samples=JSON.parse(readFileSync(new URL('../../samples/measures/'+group+'.json',import.meta.url),'utf8'));
    const vector=JSON.parse(readFileSync(new URL('../../vectors/measures/'+group+'.cli.json',import.meta.url),'utf8'));
    for(const pair of samples){
      const input=new TextEncoder().encode(JSON.stringify(pair.yes));
      const actual=JSON.parse(observe(input)[0]!.bound.values[0]!);
      const capture=vector.captures.find((c:{place:string;negative:boolean})=>c.place===pair.yes.place&&!c.negative);
      assert.ok(capture,'positive native capture missing');
      let compared=0;
      for(const event of capture.events){
        for(const line of event.stdout.split('\n')){
          if(!line.includes('scope=measurement/'+group+'/'+pair.yes.place+' '))continue;
          const value=line.match(/(?:^| )value=("(?:[^"\\]|\\.)*"|[^ ]+)/)?.[1];
          assert.ok(value,'captured wire value missing');
          assert.deepEqual(actual,JSON.parse(JSON.parse(value)));
          compared++;
        }
      }
      assert.ok(compared>=2,'native first reading and reuse must both be retained');
      assert.throws(()=>observe(new TextEncoder().encode(JSON.stringify(pair.no))),/REFUSE/);
    }
  });
}
test('the reading boundary refuses missing names and malformed UTF-8',()=>{
  assert.throws(()=>observe(new TextEncoder().encode('{}')),/REFUSE/);
  assert.throws(()=>observe(new Uint8Array([0xff])));
});
