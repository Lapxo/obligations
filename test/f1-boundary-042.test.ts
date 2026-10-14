import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {c_n} from '../src/lattice/price/premium.ts';
import {partitionScale} from './vectors-harness.ts';

const vector=JSON.parse(readFileSync(new URL('../vectors/laws/f1/path-witness.json',import.meta.url),'utf8'));
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-12);

test('F1 path construction attains c_n using the existing partition lattice, without searching pairs',()=>{
  for(const n of vector.pathSizes as number[]){
    const side=(parity:number)=>Array.from({length:n+1},(_,vertex)=>vertex)
      .filter(vertex=>vertex%2===parity)
      .map(vertex=>[vertex-1,vertex].filter(edge=>edge>=0&&edge<n));
    const x=side(0),y=side(1),{scale,worth,at,blocks}=partitionScale(n);
    const ix=at(x),iy=at(y);
    assert.equal(scale.lower(ix,iy),scale.bottomIx);
    assert.equal(scale.higher(ix,iy),scale.topIx);
    assert.equal(blocks[scale.higher(ix,iy)]!.length,n);
    const degrees=[...x,...y].map(block=>block.length);
    assert.equal(degrees.filter(d=>d===1).length,2);
    assert.equal(degrees.filter(d=>d===2).length,n-1);
    const residual=worth(ix)+worth(iy)-worth(scale.higher(ix,iy))-worth(scale.lower(ix,iy));
    near(residual,c_n(n));
  }
});

test('F1 a branching tree satisfies the same meet/join premises but fails path equality',()=>{
  const c=vector.negative,{scale,worth,at}=partitionScale(c.n),x=at(c.x),y=at(c.y);
  assert.equal(scale.lower(x,y),scale.bottomIx);
  assert.equal(scale.higher(x,y),scale.topIx);
  assert.deepEqual([...c.x,...c.y].map((block:number[])=>block.length),c.degrees);
  const residual=worth(x)+worth(y)-worth(scale.higher(x,y))-worth(scale.lower(x,y));
  near(residual,c.expectedResidual);
  assert.ok(residual<c_n(c.n));
});

test('F1 an overlap split preserves connected meet, creates discrete join and strictly raises RI',()=>{
  const c=vector.overlapReduction,{scale,worth,at,blocks}=partitionScale(c.n);
  const before=at(c.xBefore),after=at(c.xAfter),y=at(c.y);
  assert.equal(scale.lower(before,y),scale.bottomIx);
  assert.equal(scale.lower(after,y),scale.bottomIx);
  assert.notEqual(scale.higher(before,y),scale.topIx);
  assert.equal(scale.higher(after,y),scale.topIx);
  assert.ok(blocks[before]!.some(block=>block.length===c.endpointSizeBefore&&block.includes(c.splitAtom)));
  assert.ok(blocks[after]!.some(block=>block.length===1&&block[0]===c.splitAtom));
  const residual=(x:number)=>worth(x)+worth(y)-worth(scale.higher(x,y))-worth(scale.lower(x,y));
  near(residual(before),c.expectedBefore);
  near(residual(after),c.expectedAfter);
  assert.ok(residual(after)>residual(before));
  // The improvement is the strictly positive convex-increment difference.
  const phi=(t:number)=>t*Math.log2(t);
  const improvement=phi(c.endpointSizeBefore)-phi(c.endpointSizeBefore-1)-phi(c.edgeWeightBefore)+phi(c.edgeWeightBefore-1);
  near(c.n*(residual(after)-residual(before)),improvement);
});

test('F1 nontrivial meet decomposes into component RI and cannot attain global path equality',()=>{
  const c=vector.componentWitness,{scale,worth,at,blocks}=partitionScale(c.n),x=at(c.x),y=at(c.y);
  const m=scale.lower(x,y),j=scale.higher(x,y);
  assert.equal(m,at(c.components));
  assert.equal(blocks[m]!.length,2);
  assert.equal(j,scale.topIx);
  const actual=worth(x)+worth(y)-worth(j)-worth(m);
  const weighted=c.componentSizes.reduce((sum:number,n:number)=>sum+n/c.n*c_n(n),0);
  near(actual,weighted);
  assert.ok(weighted<c_n(c.n));
});

test('F1 a sole weighted edge allows an equal first split but a strict second split',()=>{
  const c=vector.soleOverlapReduction,{scale,worth,at}=partitionScale(c.n);
  const pairs=[[at(c.xBefore),at(c.yBefore)],[at(c.xAfter),at(c.yBefore)],[at(c.xAfter),at(c.yAfter)]];
  const values=pairs.map(([x,y])=>{
    assert.equal(scale.lower(x!,y!),scale.bottomIx);
    return worth(x!)+worth(y!)-worth(scale.higher(x!,y!))-worth(scale.lower(x!,y!));
  });
  near(values[0]!,c.expectedBefore);
  near(values[1]!,c.expectedFirstSplit);
  near(values[2]!,c.expectedFinal);
  near(values[2]!,c_n(c.n));
  assert.ok(values[2]!>values[1]!);
  assert.equal(scale.higher(pairs[2]![0]!,pairs[2]![1]!),scale.topIx);
});
