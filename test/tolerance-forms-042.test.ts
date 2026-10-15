import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intervals} from '../src/lattice/forms.ts';
const data=JSON.parse(readFileSync(new URL('../vectors/laws/tolerance-forms.json',import.meta.url),'utf8'));

test('tolerance forms: declared same-unit interval dilation has a different meet from the raw intervals',()=>{
  const c=data.dilation;
  assert.equal(c.radiusUnit,c.unit);
  assert.equal(c.radii.length,c.intervals.length);
  const widened=c.intervals.map(([lo,hi]:number[],i:number)=>{
    const r=c.radii[i];
    assert.ok(Number.isFinite(lo)&&Number.isFinite(hi)&&lo!<=hi!);
    assert.ok(Number.isFinite(r)&&r>=0);
    const result={lo:lo!-r,hi:hi!+r};
    assert.ok(Number.isFinite(result.lo)&&Number.isFinite(result.hi));
    return result;
  });
  assert.deepEqual(widened.map((x:{lo:number;hi:number})=>[x.lo,x.hi]),c.widened);
  const L=intervals(-1,7);
  assert.equal(L.inhabited(c.intervals.map(([lo,hi]:number[])=>({lo:lo!,hi:hi!})).reduce(L.meet,L.top)),!c.rawMeetEmpty);
  assert.deepEqual(widened.reduce(L.meet,L.top),{lo:c.widenedMeet[0],hi:c.widenedMeet[1]});
});

test('tolerance forms: an exact k-tolerant union must preserve a gap that the interval hull fills',()=>{
  const c=data.disconnectedUnion;
  assert.equal(c.m-c.k,1);
  assert.deepEqual(c.intervals,c.exactComponents);
  const L=intervals(0,2),pieces=c.intervals.map(([lo,hi]:number[])=>({lo:lo!,hi:hi!}));
  const hull=pieces.reduce(L.join,L.bottom);
  assert.deepEqual(hull,{lo:c.hull[0],hi:c.hull[1]});
  assert.equal(pieces.some((x:{lo:number;hi:number})=>x.lo<=c.excludedGapPoint&&c.excludedGapPoint<=x.hi),false);
  assert.equal(hull.lo<=c.excludedGapPoint&&c.excludedGapPoint<=hull.hi,true);
});

test('tolerance forms: the four-interval k=1 example closes exactly, while all-disjoint triples stay empty',()=>{
  const c=data.countExamples,L=intervals(0,30);
  const spans=(xs:number[][])=>xs.map(([lo,hi])=>({lo:lo!,hi:hi!}));
  const supplied=spans(c.intervals);
  const components=c.subsetIndices.map((indices:number[])=>indices.reduce((held,i)=>L.meet(held,supplied[i]!),L.top))
    .filter((held:{lo:number;hi:number})=>L.inhabited(held)).map((held:{lo:number;hi:number})=>[held.lo,held.hi]);
  assert.deepEqual(components,c.exactComponents);
  assert.equal(L.inhabited(supplied.reduce(L.meet,L.top)),false);
  const disjoint=spans(c.disjointIntervals);
  for(const indices of c.subsetIndices as number[][])
    assert.equal(L.inhabited(indices.reduce((held,i)=>L.meet(held,disjoint[i]!),L.top)),false);
});
