import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intervals} from '../src/lattice/forms.ts';
import {cell,restOf} from '../src/lattice/obligatory.ts';
import {meet} from '../src/field/meet.ts';
type Band={lo:number;hi:number};
const evidence=JSON.parse(readFileSync(new URL('../vectors/laws/a9-t99.json',import.meta.url),'utf8'));

test('A9/T99: a monotone map on an existing finite interval sublattice can alternate incomparable points',()=>{
  const L=intervals(-1,1);
  const values=[L.bottom,{lo:-1,hi:-1},{lo:1,hi:1},L.top];
  // Reflection is a counterexample map, not an implementation of a fold.
  const reflect=({lo,hi}:{lo:number;hi:number})=>({lo:-hi,hi:-lo});
  const equal=(a:{lo:number;hi:number},b:{lo:number;hi:number})=>L.leq(a,b)&&L.leq(b,a);
  for(const a of values) for(const b of values) {
    assert.ok(values.some(v=>equal(v,L.meet(a,b))));
    assert.ok(values.some(v=>equal(v,L.join(a,b))));
    if(L.leq(a,b)) assert.equal(L.leq(reflect(a),reflect(b)),true);
  }
  const a=values[1]!,b=values[2]!;
  assert.equal(L.leq(a,b)||L.leq(b,a),false);
  assert.deepEqual(reflect(a),b);
  assert.deepEqual(reflect(b),a);
  assert.equal(equal(reflect(a),a),false);
  assert.deepEqual([a,reflect(a),reflect(reflect(a))],evidence.monotoneIteration.sequence);
});

test('A9/T99: dependency traversal terminates without fixed-point iteration; cycle refusal is rooted at the queried cell',()=>{
  const L=intervals(0,10);
  const a=cell<Band>('a',0,[],['b']);
  const b=cell<Band>('b',0,[],['a']);
  const root=cell<Band>('root',0,[{origin:'o',span:{lo:2,hi:8}}],['a']);
  const world=new Map([['root',root],['a',a],['b',b]]);
  assert.deepEqual(restOf(root,world),evidence.reachableCycle.rootRest);
  assert.deepEqual(meet(L,root,world),evidence.reachableCycle.rootMeet);
  // The existing routine refuses when the queried cell itself is reached again.
  for(const c of [a,b]) assert.throws(()=>restOf(c,world),/REFUSE·rest/);
  const dag=new Map([['root',root],['a',cell<Band>('a',0,[],['b'])],['b',cell<Band>('b')]]);
  assert.deepEqual(restOf(root,dag),['a','b']);
  assert.deepEqual(meet(L,root,dag),{lo:2,hi:8});
});
