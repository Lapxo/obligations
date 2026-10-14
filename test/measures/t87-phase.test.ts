import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cancels,laminar} from '../../src/field/encounter.ts';
const load = (path:string) => JSON.parse(readFileSync(new URL(`../../${path}`,import.meta.url),'utf8'));
// Provisional F4 arithmetic under the explicitly handed integer domain.
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

test('F4: odd integer periods cannot attain the continuous halfphase entropy bound',()=>{
  // p=3 divides n=12, but s=p/2 is outside the integer-shift domain.
  assert.equal(inDomain([12,3,1.5]),false);
  const readings=[0,1,2].map(s=>ri(12,3,s));
  assert.equal(readings[1],readings[2]);
  assert.ok(readings[1]!<readings[0]!);
  assert.ok(readings[1]!>Math.log2(12/3)-1);
  assert.ok(Math.abs(readings[1]!-1.0817041659455104)<1e-12);
});
test('T87: a cancelling pair does not imply the three-origin field is nonlaminar',()=>{
  const origins=[{name:'a',phase:0},{name:'b',phase:0},{name:'c',phase:2}];
  assert.equal(cancels(origins[0]!,origins[2]!),true);
  assert.equal(laminar(origins),true);
  const intensity=(2+Math.cos(2))**2+Math.sin(2)**2;
  assert.ok(intensity>origins.length);
});

test('F4: integer-domain extrema include the one-shift period and allow negative RI',()=>{
  for(const c of load('vectors/laws/t87/phase-controls.json').extrema) {
    const values=Array.from({length:c.p},(_,s)=>ri(c.n,c.p,s));
    const minimum=Math.min(...values),maximum=Math.max(...values);
    assert.ok(Math.abs(minimum-c.minimum)<1e-12);
    assert.ok(Math.abs(maximum-c.maximum)<1e-12);
    assert.deepEqual(values.flatMap((value,s)=>Math.abs(value-minimum)<1e-12?[s]:[]),c.minShifts);
    assert.deepEqual(values.flatMap((value,s)=>Math.abs(value-maximum)<1e-12?[s]:[]),c.maxShifts);
    for(let s=1;s<c.p;s++) assert.ok(Math.abs(values[s]!-values[c.p-s]!)<1e-12);
  }
  assert.equal(ri(2,2,1),-1);
});
