import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intervals} from '../src/lattice/forms.ts';
import {cell,mark,state} from '../src/lattice/obligatory.ts';
import {observe} from '../src/field/observe.ts';
import {meet} from '../src/field/meet.ts';
const v=JSON.parse(readFileSync(new URL('../vectors/laws/knowledge-laws.json',import.meta.url),'utf8'));
const L=intervals(0,7),span=([lo,hi]:number[])=>({lo:lo!,hi:hi!});
test('L1 collecting two distinct claims grows the collection while the held interval is their meet',()=>{
 const a={id:'a',origin:'a',span:span(v.L1.claimSpans[0])},b={id:'b',origin:'b',span:span(v.L1.claimSpans[1])};
 const ab=observe(observe(cell('x'),a),b),ba=observe(observe(cell('x'),b),a);
 assert.equal(ab.seen.length,2);assert.equal(ba.seen.length,2);
 assert.deepEqual(new Set(ab.seen.map(c=>c.id)),new Set(ba.seen.map(c=>c.id)));
 assert.deepEqual(meet(L,ab),span(v.L1.expectedMeet));assert.deepEqual(meet(L,ba),meet(L,ab));
 assert.deepEqual(L.join(a.span,b.span),span(v.L1.expectedUnionOfAdmissibleValues));
 assert.notDeepEqual(meet(L,ab),L.join(a.span,b.span));
});
test('L1 effective widening order is distinct from unordered claim collection',()=>{
 const tight=mark({pole:'ceiling',reach:'local',span:{lo:0,hi:1},at:1});
 const wide=mark({pole:'ceiling',reach:'local',span:{lo:0,hi:7},widens:'witness',at:2});
 const base=cell('x',0,[{origin:'a',span:L.top},{origin:'b',span:L.top}]);
 assert.deepEqual(meet(L,{...base,marks:[tight,wide]}),{lo:0,hi:7});
 assert.deepEqual(meet(L,{...base,marks:[wide,tight]}),{lo:0,hi:7});
 assert.deepEqual(meet(L,{...base,marks:[{...wide,at:1},{...tight,at:2}]}),{lo:0,hi:1});
 // Equal timestamps retain distinct handed sequence order; do not erase it.
 assert.deepEqual(meet(L,{...base,marks:[tight,{...wide,at:1}]}),{lo:0,hi:7});
 assert.deepEqual(meet(L,{...base,marks:[{...wide,at:1},tight]}),{lo:0,hi:1});
});
test('L3 two admissible singleton candidates stay incompatible in either arrival order',()=>{
 const claims=v.L3.candidateValues.map((value:number)=>({id:`branch${value}`,origin:`o${value}`,span:{lo:value,hi:value}}));
 for(const order of [claims,[...claims].reverse()]){
  const held=order.reduce((one:ReturnType<typeof cell<{lo:number;hi:number}>>,claim:typeof claims[0])=>observe(one,claim),cell('x'));
  assert.equal(state(L,held),v.L3.expectedState);assert.equal(L.inhabited(meet(L,held)),false);
  assert.equal(held.seen.length,2);
 }
 for(const chosen of claims)assert.ok(claims.some((possibleTruth:typeof claims[0])=>!L.inhabited(L.meet(chosen.span,possibleTruth.span))));
});
test('L7 active covering contribution c/n does not equal whole-mixture unanimity on v',()=>{
 const {c,n,activeTruthSymbolTables,privateTruthSymbolTable}=v.L7;
 const marginal=(table:number[][],symbol:number)=>table.reduce((sum,row)=>sum+row[symbol]!,0);
 for(const [index,table] of activeTruthSymbolTables.entries()){
  const correctness=(joint:number[][])=>joint.reduce((sum,row,t)=>sum+row[t]!,0);
  assert.equal(c*correctness(table)+(1-c)*correctness(privateTruthSymbolTable),v.L7.wholeMixtureCorrectness[index]);
  assert.equal(table.flat().reduce((sum:number,p:number)=>sum+p,0),1);
  for(let symbol=0;symbol<n;symbol++){
   const active=marginal(table,symbol);
   assert.equal(active,v.L7.activeConditionalUnanimityOnEachValue);
   assert.equal(c*active,v.L7.activeJointUnanimityOnEachValue);
   assert.equal(c*active+(1-c)*marginal(privateTruthSymbolTable,symbol),v.L7.wholeMixtureUnanimityOnEachValue);
   assert.notEqual(v.L7.wholeMixtureUnanimityOnEachValue,c/n);
  }
 }
});
