import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intervals} from '../src/lattice/forms.ts';
import {cell,mark,state} from '../src/lattice/obligatory.ts';
import {meet} from '../src/field/meet.ts';
import {observe} from '../src/field/observe.ts';
import {join} from '../src/field/join.ts';
const c=JSON.parse(readFileSync(new URL('../vectors/laws/a7-t90.json',import.meta.url),'utf8')).case;
const L=intervals(0,7),span=([lo,hi]:number[])=>({lo:lo!,hi:hi!});
const bits=(one:ReturnType<typeof cell<{lo:number;hi:number}>>)=>{
 const held=meet(L,one);
 return L.inhabited(held)?Math.log2(held.hi-held.lo+1):0;
};
const object=()=>cell(c.object,0,c.claims.map((claim:{id:string;origin:string;span:number[]})=>({...claim,span:span(claim.span)})));
test('A7/T90: one additive narrowing lowers freedom and its exact withdrawal restores it on the same object',()=>{
 const before=object(),claim={...c.narrowingClaim,span:span(c.narrowingClaim.span)};
 const narrowed=observe(before,claim),withdrawn=observe(narrowed,claim,-1);
 assert.deepEqual([bits(before),bits(narrowed),bits(withdrawn)],[c.expected.beforeBits,c.expected.narrowedBits,c.expected.withdrawnBits]);
 assert.deepEqual([state(L,before),state(L,narrowed),state(L,withdrawn)],c.expected.narrowingStates);
 assert.deepEqual(narrowed.at,before.at);assert.deepEqual(withdrawn.at,before.at);
 assert.equal(withdrawn.seen.length,before.seen.length+2);
});
test('A7/T90: witnessed local join increases freedom without a new coordinate, withdrawal or forgetting',()=>{
 const before={...object(),marks:[mark({pole:'ceiling',reach:'local',span:span(c.localCeiling),at:0})]};
 const widened=join(L,before,span(c.widening),c.witness,1);
 assert.deepEqual([bits(before),bits(widened)],[c.expected.signedBits,c.expected.widenedBits]);
 assert.deepEqual([state(L,before),state(L,widened)],c.expected.wideningStates);
 assert.deepEqual(widened.at,before.at);assert.equal(widened.epoch,before.epoch);
 assert.deepEqual(widened.seen,before.seen);assert.deepEqual(widened.restsOn,before.restsOn);
 assert.equal(widened.marks.length,before.marks.length+1);
 assert.throws(()=>join(L,before,span(c.widening),'',1),{code:'join-unwitnessed'});
});
