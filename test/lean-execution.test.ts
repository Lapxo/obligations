import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {auditLeanAxioms,judgeLeanNegative,executeLean,type LeanProcess} from './support/semilattice-reader.ts';
const base=new URL('../',import.meta.url);
const vector=JSON.parse(readFileSync(new URL('vectors/laws/meet-semilattice.json',base),'utf8'));
const helly=JSON.parse(readFileSync(new URL(vector.execution.hellyVector,base),'utf8'));
const handed=vector.execution.identityInputs.map((p:string)=>[p,readFileSync(new URL(p,base),'utf8')] as const);
const manifest=JSON.parse(handed.find(([p]:readonly [string,string])=>p.endsWith('lake-manifest.json'))![1]);
const names=[...vector.proof.auditedTheorems.map((n:string)=>'Obligations.Cell.'+n),...helly.execution.auditedTheorems];
function fixture(){const root=mkdtempSync(join(tmpdir(),'lean-reader-test-'));for(const [p,t] of handed){mkdirSync(dirname(join(root,p)),{recursive:true});writeFileSync(join(root,p),t);}for(const p of manifest.packages)mkdirSync(join(root,'proofs/lean/.lake/packages',p.name),{recursive:true});return root;}
function replay(change?:'axiom'|'accepted-negative'|'wrong-cause'):LeanProcess{return (command,args)=>{
 let stdout='';let status=0;
 if(command==='lean')stdout='Lean (version 4.19.0, test-host, commit 6caaee842e94, Release)\n';
 else if(command==='git'&&args.includes('rev-parse'))stdout=manifest.packages.find((p:any)=>args[1]!.endsWith('/'+p.name)).rev+'\n';
 else if(command==='lake'&&args.some(a=>a.endsWith('/audit.lean')))stdout=names.map((n:string,i:number)=>`'${n}' ${change==='axiom'&&i===0?'depends on axioms: [sorryAx]':'does not depend on any axioms'}`).join('\n')+'\n';
 else if(command==='lake'&&args.some(a=>/\/(?:raw-antisymmetry|nonconvex-helly)\.lean$/.test(a))){status=change==='accepted-negative'?0:1;stdout=change==='wrong-cause'?'unknown import\n':"error: tactic 'decide' proved that the proposition is false\n";}
 return {status,stdout,stderr:''};
};}
test('Lean audit rejects an unapproved axiom including sorryAx',()=>{
 auditLeanAxioms("'A' depends on axioms: [propext, Quot.sound]",['A'],vector.proof.allowedAxioms);
 for(const axiom of ['sorryAx','Lean.ofReduceBool','invented'])assert.throws(()=>auditLeanAxioms(`'A' depends on axioms: [${axiom}]`,['A'],vector.proof.allowedAxioms),/unapproved-axiom/);
 assert.throws(()=>auditLeanAxioms('', ['A'], []),/axiom-audit/);
});
test('Lean negative requires refusal by its declared cause',()=>{
 const n=vector.execution.negative;
 assert.throws(()=>judgeLeanNegative({status:0,stdout:'',stderr:''},n),/negative-accepted/);
 assert.throws(()=>judgeLeanNegative({status:1,stdout:'missing import',stderr:''},n),/negative-wrong-cause/);
});
test('Lean process protocol replay preserves every declared input and rejects changed evidence',()=>{
 const root=fixture();try{
  const first=executeLean(handed,root,replay());
  assert.equal(first[0]!.bound?.hi,0);
  const original=replay();
  const warmed:LeanProcess=(command,args,options)=>{const result=original(command,args,options);return command==='lake'&&args[0]==='build'?{...result,stdout:'Build completed successfully (cached).\n'}:result;};
  assert.deepEqual(executeLean(handed,root,warmed),first,'operational transcript changes never change the semantic verdict or verification identity');
  assert.throws(()=>executeLean(handed,root,replay('axiom')),/unapproved-axiom/);
  assert.throws(()=>executeLean(handed,root,replay('accepted-negative')),/process-exit|negative-accepted/);
  assert.throws(()=>executeLean(handed,root,replay('wrong-cause')),/negative-wrong-cause/);
  writeFileSync(join(root,'proofs/lean/Obligations/Cell.lean'),'altered');
  let calls=0;assert.throws(()=>executeLean(handed,root,()=>{calls++;throw Error('must not execute');}),/fixture-source-differs/);assert.equal(calls,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
