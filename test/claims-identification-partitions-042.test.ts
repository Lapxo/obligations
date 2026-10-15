import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {add,sub,mul,div,one,zero,q,rational,pack,type Q} from '../src/measures/rational.ts';
import {partitionsOf,partitionScale} from './vectors-harness.ts';
const v=JSON.parse(readFileSync(new URL('../vectors/laws/claims-identification-partitions.json',import.meta.url),'utf8'));
// Exact affine arithmetic on supplied scalar probabilities, not a causal evaluator.
const coincidence=(n:number,p:Q,accuracy:Q)=>add(mul(accuracy,sub(one,p)),mul(sub(one,accuracy),div(p,q(BigInt(n-1)))));
test('C4 active-conditioned coincidence exactly identifies q when the known external channel is nonuniform',()=>{
 const c=v.C4.positive,p=rational(c.p),accuracy=rational(c.q),rate=coincidence(c.n,p,accuracy);
 const off=div(p,q(BigInt(c.n-1))),slope=sub(sub(one,p),off);
 assert.deepEqual(pack(rate),pack(rational(c.coincidence)));assert.deepEqual(pack(slope),pack(rational(c.slope)));
 assert.deepEqual(pack(div(sub(rate,off),slope)),pack(accuracy));
});
test('C4 uniform external channel has zero slope and cannot distinguish accuracies',()=>{
 const c=v.C4.uniformNegative,p=rational(c.p),off=div(p,q(BigInt(c.n-1)));
 assert.deepEqual(sub(sub(one,p),off),zero);
 for(const accuracy of c.accuracies)assert.deepEqual(pack(coincidence(c.n,p,rational(accuracy))),pack(rational(c.coincidence)));
});
test('C4 unconditioned mixture with unknown activation admits different q at the same coincidence',()=>{
 const c=v.C4.mixtureNegative,p=rational(c.externalP);
 for(const parameters of c.parameterPairs){
  const active=rational(parameters.c),accuracy=rational(parameters.q);
  const mixture=add(mul(active,coincidence(c.n,p,accuracy)),mul(sub(one,active),sub(one,p)));
  assert.deepEqual(pack(mixture),pack(rational(c.wholeCoincidence)));
 }
 assert.notEqual(c.parameterPairs[0].q,c.parameterPairs[1].q);
 for(const accuracy of ['0','1'])assert.deepEqual(add(mul(zero,coincidence(c.n,p,rational(accuracy))),mul(one,sub(one,p))),sub(one,p));
});
type Constraint={a:number;b:number;same:boolean};
const satisfies=(partition:number[][],claims:Constraint[])=>claims.every(claim=>partition.some(block=>block.includes(claim.a)&&block.includes(claim.b))===claim.same);
test('C5 equality paths plus endpoint inequality are minimal incompatible families on three and five elements',()=>{
 for(const n of v.C5.witnessSizes){
  const partitions=partitionsOf(n);
  const constraints:Constraint[]=[...Array.from({length:n-1},(_,i)=>({a:i,b:i+1,same:true})),{a:0,b:n-1,same:false}];
  assert.equal(constraints.length,n);assert.equal(partitions.some(p=>satisfies(p,constraints)),false);
  for(let omitted=0;omitted<n;omitted++){
   const remaining=constraints.filter((_,i)=>i!==omitted);
   const constructed=omitted===n-1?[Array.from({length:n},(_,i)=>i)]:[Array.from({length:omitted+1},(_,i)=>i),Array.from({length:n-omitted-1},(_,i)=>i+omitted+1)];
   assert.equal(satisfies(constructed,remaining),true);
   assert.equal(partitions.some(p=>satisfies(p,remaining)),true);
  }
 }
});
test('C5 equality-only and refinement-only constraints have different always-compatible witnesses',()=>{
 const n=4,equalities=Array.from({length:n-1},(_,i)=>({a:i,b:i+1,same:true}));
 const coarse=[Array.from({length:n},(_,i)=>i)],fine=Array.from({length:n},(_,i)=>[i]);
 assert.equal(satisfies(coarse,equalities),true);assert.equal(satisfies(fine,equalities),false);
 const {scale,at}=partitionScale(n),finest=at(fine);
 for(const partition of partitionsOf(n))assert.equal(scale.leq(at(partition),finest),true);
});
