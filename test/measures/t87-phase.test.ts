import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cancels} from '../../src/field/encounter.ts';
const load = (path:string) => JSON.parse(readFileSync(new URL(`../../${path}`,import.meta.url),'utf8'));
// Proposed F4 arithmetic only. This is not an exported measure or a native reading adapter.
const inDomain = ([n,p,s]:[number,number,number]) => Number.isSafeInteger(n)&&n>0&&Number.isSafeInteger(p)&&p>0&&
  n%p===0&&Number.isSafeInteger(s)&&s>=0&&s<p;
const ri = (n:number,p:number,s:number) => {
  if(!inDomain([n,p,s])) throw new Error('provisional F4 domain');
  const t=s/p;
  const entropy=t===0?0:-t*Math.log2(t)-(1-t)*Math.log2(1-t);
  return Math.log2(n/p)-entropy;
};
test('F4 provisional domain rejects nondivisors and out-of-domain shifts',()=>{
  for(const c of load('samples/laws/t87/phase-domain.json').cases) {
    assert.equal(inDomain(c.input),c.accepted);
    if(!c.accepted) assert.throws(()=>ri(...c.input as [number,number,number]),/provisional F4 domain/);
  }
});
test('F4 fixed phase controls show halfphase one bit below inphase; objective remains open',()=>{
  const cs=load('vectors/laws/t87/phase-controls.json').cases;
  for(const c of cs) assert.ok(Math.abs(ri(c.n,c.p,c.s)-c.expected)<1e-12);
  assert.equal(ri(12,4,0)-ri(12,4,2),1);
  assert.ok(ri(12,4,1)>ri(12,4,2));
  assert.equal(ri(12,4,1),ri(12,4,3));
});
test('T87 raw angle-distance statement needs wrapped phase: 0 and 2pi reinforce',()=>{
  const a={name:'a',phase:0}; const b={name:'b',phase:2*Math.PI};
  assert.ok(Math.abs(a.phase-b.phase)>Math.PI/2);
  assert.equal(cancels(a,b),false);
  assert.ok(Math.abs((Math.cos(a.phase)+Math.cos(b.phase))**2+(Math.sin(a.phase)+Math.sin(b.phase))**2-4)<1e-12);
});
