import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {budget,decohere,distinct,sameObject} from '../src/views/field/physics.ts';
import {cell} from '../src/lattice/obligatory.ts';
import {intervals} from '../src/lattice/forms.ts';
import {cancels,pairs} from '../src/field/encounter.ts';
const load=(p:string)=>JSON.parse(readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
test('H5 dependent offers preserve finite arithmetic when the research interpretation is experimental',()=>{
 const L=intervals(-Infinity,Infinity);
 const claims=Array.from({length:4},(_,i)=>({origin:`o${i}`,at:0,span:{lo:0,hi:1}}));
 const world=[cell('a',0,[{origin:'a',span:{lo:48,hi:100}}]),cell('b',0,[{origin:'b',span:{lo:51,hi:100}}])];
 const before=JSON.stringify({claims,world});
 const c=load('samples/yes/H5-hilbert-is-the-obligatory-without-four-fields.json').cases[0];
 for(let i=0;i<c.environment.length;i++)assert.equal(Number(decohere(claims,c.environment[i],c.period).toFixed(2)),c.coherence[i]);
 assert.equal(distinct(L,world,1),2);assert.equal(distinct(L,world,16),1);
 assert.equal(sameObject(L,world[0]!,world[1]!,1),false);assert.equal(sameObject(L,world[0]!,world[1]!,16),true);
 assert.equal(budget(c.cells,c.resolution),c.budget);assert.throws(()=>budget(300,0),/no resolution/);
 assert.equal(JSON.stringify({claims,world}),before);
});
test('T87 bounded identity is invariant under whole turns and separates reinforce from cancel',()=>{
 for(const delta of [0,Math.PI/3,2*Math.PI/3,Math.PI])for(const turns of [-2,0,3]){
  const raw=delta+turns*2*Math.PI,principal=Math.acos(Math.cos(raw));
  const squared=(1+Math.cos(raw))**2+Math.sin(raw)**2;
  assert.ok(Math.abs(squared-(2+2*Math.cos(principal)))<1e-12);
  assert.equal(cancels({name:'a',phase:0},{name:'b',phase:raw}),principal>Math.PI/2);
 }
 assert.equal(cancels({name:'a',phase:0},{name:'b',phase:2*Math.PI}),false);
});

test('T88 three evenly spaced phases distinguish the amplitude identity from a universal forks/closes ratio',()=>{
 const equallySpaced=[0,2*Math.PI/3,4*Math.PI/3].map((phase,i)=>({name:`o${i}`,phase}));
 assert.deepEqual(pairs(equallySpaced),{forks:3,closes:0});
 for(let i=0;i<equallySpaced.length;i++)for(let j=i+1;j<equallySpaced.length;j++){
  const a=equallySpaced[i]!,b=equallySpaced[j]!;
  const squared=(Math.cos(a.phase)+Math.cos(b.phase))**2+(Math.sin(a.phase)+Math.sin(b.phase))**2;
  assert.ok(Math.abs(squared-1)<1e-12);
  assert.equal(cancels(a,b),true);
 }
 // T87 holds on each pair, yet no close exists: no finite ratio equal to one.
 assert.notEqual(pairs(equallySpaced).forks,pairs(equallySpaced).closes);
});
