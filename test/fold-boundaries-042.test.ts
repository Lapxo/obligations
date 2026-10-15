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
  assert.equal(equal(reflect(values[0]!),values[0]!),true);
  assert.equal(equal(reflect(values[3]!),values[3]!),true);
  const a=values[1]!,b=values[2]!;
  assert.equal(L.leq(a,b)||L.leq(b,a),false);
  assert.deepEqual(reflect(a),b);
  assert.deepEqual(reflect(b),a);
  assert.equal(equal(reflect(a),a),false);
  assert.deepEqual([a,reflect(a),reflect(reflect(a))],evidence.monotoneIteration.sequence);
});

test('A9/T99: a cycle among reachable ancestors refuses every root that reaches it',()=>{
  const L=intervals(0,10);
  const a=cell<Band>('a',0,[],['b']);
  const b=cell<Band>('b',0,[],['a']);
  const root=cell<Band>('root',0,[{origin:'o',span:{lo:2,hi:8}}],['a']);
  const world=new Map([['root',root],['a',a],['b',b]]);
  for(const c of [root,a,b])assert.throws(()=>restOf(c,world),{code:'rest-cycle'});
  assert.throws(()=>meet(L,root,world),{code:'rest-cycle'});
});

test('A9/T99: diamond ancestors preserve breadth-first first-seen order without a false cycle',()=>{
  const root=cell<Band>('root',0,[],['a','b','a']);
  const world=new Map([
    ['a',cell<Band>('a',0,[],['shared','missing'])],
    ['b',cell<Band>('b',0,[],['shared'])],
    ['shared',cell<Band>('shared',0,[],['last'])],
    ['last',cell<Band>('last')],
    // Unreachable cyclic coordinates do not invalidate this query.
    ['x',cell<Band>('x',0,[],['y'])],['y',cell<Band>('y',0,[],['x'])],
  ]);
  assert.deepEqual(restOf(root,world),['a','b','shared','missing','last']);
  assert.deepEqual(restOf(cell<Band>('root',0,[],['missing']),world),['missing']);
  assert.deepEqual(restOf(cell<Band>('empty'),world),[]);
});

test('A9/T99: a deep acyclic chain is read iteratively in the established order',()=>{
  const n=12000,root=cell<Band>('root',0,[],['v0']);
  const names=Array.from({length:n},(_,i)=>`v${i}`);
  const world=new Map(names.map((name,i)=>[name,cell<Band>(name,0,[],i+1<n?[names[i+1]!]:[])]));
  assert.deepEqual(restOf(root,world),names);
});

// Independent finite graph oracle: reachability followed by Kahn elimination.
// It neither folds claims nor evaluates marks, and ignores unreachable cycles.
function reachableIsAcyclic(edges:ReadonlyMap<string,readonly string[]>,starts:readonly string[]):boolean{
  const reachable=new Set<string>(),frontier=[...starts];
  for(let i=0;i<frontier.length;i++){
    const at=frontier[i]!;
    if(reachable.has(at))continue;
    reachable.add(at);frontier.push(...(edges.get(at)??[]));
  }
  const incoming=new Map([...reachable].map(at=>[at,0]));
  for(const at of reachable)for(const to of edges.get(at)??[])incoming.set(to,incoming.get(to)!+1);
  const ready=[...incoming].filter(([,count])=>count===0).map(([at])=>at);
  let removed=0;
  for(let i=0;i<ready.length;i++){
    removed++;
    for(const to of edges.get(ready[i]!)??[]){const left=incoming.get(to)!-1;incoming.set(to,left);if(left===0)ready.push(to);}
  }
  return removed===reachable.size;
}

test('A9/T99: all 512 three-coordinate directed graphs agree with an independent reachable-DAG oracle',()=>{
  const names=['a','b','c'];
  for(let mask=0;mask<1<<9;mask++){
    const edges=new Map(names.map((name,i)=>[name,names.filter((_,j)=>mask&(1<<(i*3+j)))]));
    const root=cell<Band>('root',0,[],['a']);
    const world=new Map([...edges].map(([name,rests])=>[name,cell<Band>(name,0,[],rests)]));
    if(reachableIsAcyclic(edges,['a']))assert.doesNotThrow(()=>restOf(root,world),`graph ${mask}`);
    else assert.throws(()=>restOf(root,world),{code:'rest-cycle'},`graph ${mask}`);
  }
});

test('A9/T99: the supplied root defines the query even when a world entry with its name disagrees',()=>{
 const supplied=cell<Band>('root');
 const conflictingEntry=cell<Band>('root',0,[],['root']);
 assert.deepEqual(restOf(supplied,new Map([['root',conflictingEntry]])),[]);
 assert.throws(()=>restOf(conflictingEntry,new Map([['root',supplied]])),{code:'rest-cycle'});
});
