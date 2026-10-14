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
