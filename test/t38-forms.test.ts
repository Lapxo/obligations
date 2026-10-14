import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { intervals } from '../src/lattice/forms.ts';
const load = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const L = intervals(0, 10);
test('T38: existing interval meet distinguishes overlap from a two-member empty witness', () => {
  for (const c of load('samples/laws/t38/intervals.json').cases) {
    const xs = c.intervals.map(([lo, hi]: number[]) => ({lo: lo!, hi: hi!}));
    const held = xs.reduce(L.meet, L.top);
    if (c.expected) {
      assert.deepEqual(held, {lo: c.expected[0], hi: c.expected[1]});
      for (let i=0;i<xs.length;i++) for(let j=i+1;j<xs.length;j++) assert.equal(L.inhabited!(L.meet(xs[i], xs[j])), true);
    } else {
      assert.equal(L.inhabited!(held), false);
      assert.equal(L.inhabited!(L.meet(xs[c.emptyWitness[0]], xs[c.emptyWitness[1]])), false);
    }
  }
});
test('F2: five-point cyclic arcs have every pair inhabited and their triple empty', () => {
  const c = load('vectors/laws/t38/circle12.json').cases[0];
  const arcs: number[][] = c.starts.map((s:number) => Array.from({length:c.length},(_,k)=>(s+k)%c.n));
  assert.deepEqual(arcs, c.expectedArcs);
  const intersect = (a:number[],b:number[]) => a.filter(x=>b.includes(x));
  assert.deepEqual([[0,1],[0,2],[1,2]].map(([a,b])=>intersect(arcs[a!]!,arcs[b!]!)), c.expectedPairMeets);
  assert.deepEqual(arcs.reduce(intersect), c.expectedTripleMeet);
});
test('F3: fixed feasible witnesses and nonnegative Farkas certificates distinguish two and three', () => {
  for(const c of load('vectors/laws/t38/halfplanes.json').cases) {
    const satisfies = (indices:number[],point:number[]) => indices.every(i=>{
      const [a,b,bound]=c.planes[i]; return a*point[0]!+b*point[1]!<=bound;
    });
    if(c.feasibleSubset) assert.equal(satisfies(c.feasibleSubset.indices,c.feasibleSubset.point),true);
    for(const witness of c.pairWitnesses??[]) assert.equal(satisfies(witness.indices,witness.point),true);
    assert.equal(c.weights.length,c.planes.length);
    assert.ok(c.weights.every((w:number)=>Number.isFinite(w)&&w>=0));
    const sum=[0,1,2].map(j=>c.planes.reduce((acc:number,plane:number[],i:number)=>acc+c.weights[i]*plane[j]!,0));
    assert.deepEqual(sum,c.expectedSum);
    assert.equal(sum[0],0); assert.equal(sum[1],0); assert.ok(sum[2]!<0);
    if(c.conflictIndices) assert.deepEqual(c.weights.flatMap((w:number,i:number)=>w>0?[i]:[]), c.conflictIndices);
  }
});
test('F1: finite formula arithmetic and Bell squared counts are reproduced, not optimality or independence',()=>{
  const bell=[1];
  for(let n=0;n<7;n++) {
    let choose=1, next=0;
    for(let k=0;k<=n;k++) {next+=choose*bell[k]!;choose=choose*(n-k)/(k+1);}
    bell.push(next);
  }
  for(const c of load('vectors/laws/f1/finite-arithmetic.json').cases) {
    assert.equal(bell[c.n],c.bell);
    assert.equal(c.bell*c.bell,c.pairs);
    assert.ok(Math.abs(Math.log2(c.n)-2+2/c.n-c.expected)<1e-12);
  }
});
