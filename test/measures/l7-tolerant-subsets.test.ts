import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tolerantSubsetConfidence,independentCountConfidence,type JointIndependenceDeclaration} from '../../src/measures/tolerant-subsets.ts';
import {tolerantCountConfidence} from '../../src/measures/confidence.ts';
import {rational,pack,sub,add,one,zero} from '../../src/measures/rational.ts';
const declared=(ps:readonly string[])=>ps.map((p,i)=>({id:String(i),p,justification:`hypothesis:${i}`}));
const space='declared:finite-common-space';
const vector=JSON.parse(readFileSync(new URL('../../vectors/laws/l7-tolerant-k.json',import.meta.url),'utf8'));
test('L7 exact oracles include sum-p>=1 without triviality and retain stronger 0.4.2 bound',()=>{
  for(const c of vector.cases){
    const input=declared(c.p),before=JSON.stringify(input);
    const out=tolerantSubsetConfidence(input,c.k,space);
    assert.deepEqual(out.failureUpperBound,pack(rational(c.subsetFailureBound)));
    assert.equal(out.trivial,c.trivial);assert.equal(out.probabilitySpace,space);
    assert.equal(out.referencesVerified,false);assert.equal(JSON.stringify(input),before);
    if(c.uncappedFailureBound)assert.deepEqual(out.uncappedFailureBound,pack(rational(c.uncappedFailureBound)));
    assert.deepEqual(tolerantSubsetConfidence([...input].reverse(),c.k,space).failureUpperBound,out.failureUpperBound);
  }
  assert.deepEqual(tolerantCountConfidence(declared(['1/10','1/10','1/10']),1).value,pack(rational('17/20')));
  const old=vector.cases.find((c:{oldClaimedSuccess?:string})=>c.oldClaimedSuccess);
  assert.deepEqual(sub(one,old.p.slice(0,old.k+1).map(rational).reduce(add,zero)),rational(old.oldClaimedSuccess));
});
test('L7 actual dependent witness refutes top-k+1 guarantee',()=>{
  const c=vector.oldClaimActualCounterexample;
  for(let i=0;i<c.p.length;i++)assert.equal(c.outcomes.reduce((sum:number,row:{weight:number;failed:number[]})=>sum+(row.failed.includes(i)?row.weight:0),0),1);
  const success=c.outcomes.reduce((sum:number,row:{weight:number;failed:number[]})=>sum+(row.failed.length<=c.k?row.weight:0),0);
  assert.equal(success,7);assert.equal(c.denominator,10);
  assert.deepEqual(tolerantCountConfidence(declared(c.p),c.k).value,pack(rational(c.actualSuccess)));
  assert.ok(success/c.denominator<Number(rational(c.oldClaimedSuccess)[0])/Number(rational(c.oldClaimedSuccess)[1]));
});
test('L7 sorted coefficient formula bounds all triples of events on nonuniform four-atom space',()=>{
  const weights=[1,2,3,4],mass=(event:number)=>weights.reduce((sum,w,a)=>sum+((event&(1<<a))?w:0),0);
  for(let a=0;a<16;a++)for(let b=0;b<16;b++)for(let c=0;c<16;c++)for(let k=0;k<=3;k++){
    const events=[a,b,c],out=tolerantSubsetConfidence(declared(events.map(e=>mass(e)+'/10')),k,space);
    const actual=weights.reduce((sum,w,atom)=>sum+(events.filter(e=>e&(1<<atom)).length>k?w:0),0);
    assert.ok(BigInt(actual)*BigInt(out.failureUpperBound.denominator)<=10n*BigInt(out.failureUpperBound.numerator));
    if(k===1){const p=events.map(mass),sum=Math.min(p[0]!,p[1]!)+Math.min(p[0]!,p[2]!)+Math.min(p[1]!,p[2]!);
      assert.deepEqual(out.uncappedFailureBound,pack(rational(sum+'/10')));}
  }
});
test('L7 pairwise zero correlation cannot pay for joint-independence convolution',()=>{
  const c=vector.pairwiseNotJoint,states=c.states.map((s:string)=>[...s].map(Number));
  for(let i=0;i<3;i++){
    assert.equal(states.filter((s:number[])=>s[i]).length,2);
    for(let j=i+1;j<3;j++)assert.equal(states.filter((s:number[])=>s[i]&&s[j]).length,1);
  }
  assert.equal(states.filter((s:number[])=>s.reduce((a,b)=>a+b,0)>c.k).length,3);
  const sample=JSON.parse(readFileSync(new URL('../../samples/measures/l7-tolerant-k.json',import.meta.url),'utf8'));
  assert.throws(()=>independentCountConfidence(sample.no.failures,sample.no.k,sample.no.independence),/REFUSE·L7 joint-independence-required/);
  const d=sample.independentYes.independence,before=JSON.stringify(d);
  const out=independentCountConfidence(sample.independentYes.failures,1,d);
  assert.deepEqual(out.failureUpperBound,pack(rational(c.independentFailure)));
  assert.deepEqual(out.bernoulliEnvelope,['1/8','3/8','3/8','1/8'].map(x=>pack(rational(x))));
  assert.equal(out.jointIndependence.declared,true);assert.equal(out.referencesVerified,false);assert.equal(JSON.stringify(d),before);
  assert.deepEqual(independentCountConfidence([],0,d).value,pack(one));
  const captures=vector.nativeCapture.captures.filter((c:{case:string})=>c.case==='independentYes');
  assert.equal(captures.length,2);assert.equal(new Set(captures.map((c:{place:string})=>c.place)).size,2);
  for(const capture of captures){
    assert.equal(capture.status,0);assert.equal(capture.repeat.byteIdentical,true);
    const answer=JSON.parse(capture.stdout.trim());assert.equal(answer[0].kind,'fact');
    assert.deepEqual(JSON.parse(answer[0].claims[0].bound.values[0]).result.failureUpperBound,out.failureUpperBound);
  }
});
test('L7 refuses absent hypotheses, malformed marginals and count domains by name',()=>{
  const f=declared(['1/2']);
  for(const k of [-1,.5,2,NaN,Infinity])assert.throws(()=>tolerantSubsetConfidence(f,k,space),/allowed-failure-count-outside/);
  for(const p of ['-1/10','11/10','not-a-probability'])assert.throws(()=>tolerantSubsetConfidence(declared([p]),0,space));
  assert.throws(()=>tolerantSubsetConfidence(f,0,''),/common-probability-space-required/);
  assert.throws(()=>tolerantSubsetConfidence([{...f[0]!,justification:''}],0,space),/justification reference required/);
  assert.throws(()=>tolerantSubsetConfidence([f[0]!,f[0]!],0,space),/duplicate failure identity/);
  assert.throws(()=>tolerantSubsetConfidence(new Array(1),0,space),/failure identity required/);
  assert.throws(()=>independentCountConfidence(f,0,{probabilitySpace:space,jointIndependence:true,justification:''}),/joint-independence-justification-required/);
  assert.throws(()=>independentCountConfidence(f,0,undefined as unknown as JointIndependenceDeclaration),/joint-independence-required/);
});
