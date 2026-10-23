import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

// Verification infrastructure only. Mathematical assertions remain in the library's tests and Lean proofs.
const manifestText=readFileSync(new URL('./inputs.json',import.meta.url),'utf8');
const manifest=JSON.parse(manifestText);
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const refuse=cause=>{throw Error('REFUSE·obligations-verification/'+cause)};
function inputs(asked){
 const spec=manifest.readings.find(s=>asked.region===s.region||asked.region===s.region+'-inputs');
 if(!spec)refuse('undeclared-reading');
 const rows=asked.lines.filter(l=>l.measure==='text'&&l.value==='lock'),files=new Map();
 for(const row of rows){
  if(files.has(row.scope))refuse('duplicate-input');
  if(!Object.hasOwn(spec.files,row.scope)&&row.scope!=='verification/inputs.json')refuse('undeclared-input');
  const expected=row.scope==='verification/inputs.json'?digest(manifestText):spec.files[row.scope];
  if(typeof row.about!=='string'||digest(Buffer.from(row.about))!==expected)refuse('input-differs');
  files.set(row.scope,row.about);
 }
 for(const name of [...Object.keys(spec.files),'verification/inputs.json'])if(!files.has(name))refuse('missing-input');
 return{spec,files};
}
export function render(asked){
 const{spec}=inputs(asked);
 if(asked.region!==spec.region+'-inputs')refuse('undeclared-projection');
 return[`bound-lock/1 at=receipt:1 form=alphabet measure=reads role=reads scope=${spec.scope} value=${[...Object.keys(spec.files),'verification/inputs.json'].join('|')}`];
}
function checkedRun(command,args,cwd,env,deadline){
 const remaining=deadline-Date.now();if(remaining<=0)refuse('execution-budget');
 const run=spawnSync(command,args,{cwd,env,encoding:'utf8',timeout:remaining,maxBuffer:2097152});
 if(run.error?.code==='ETIMEDOUT'||run.signal)refuse('execution-budget');
 if(run.error||run.status!==0)refuse('mathematical-check-failed');
 return run.stdout;
}
function prove(spec,root,env,deadline){
 const compiler=process.env.OBLIGATIONS_LEAN||'lean';
 const version=checkedRun(compiler,['--version'],root,env,deadline);
 if(!version.includes('version 4.19.0'))refuse('compiler-version');
 const dependencyPath=process.env.OBLIGATIONS_LEAN_DEPENDENCIES;
 if(!dependencyPath)refuse('proof-dependencies-required');
 const external=dependencyPath.split(':').filter(Boolean);
 if(!external.length||external.some(p=>!existsSync(p)))refuse('proof-dependencies-missing');
 const lib=join(root,'compiled');mkdirSync(lib);
 const proofEnv={...env,LEAN_PATH:[lib,...external].join(':')};
 const project=join(root,'proofs/lean');
 for(const name of spec.modules){
  const out=join(lib,name.replace(/\.lean$/,'.olean'));mkdirSync(dirname(out),{recursive:true});
  checkedRun(compiler,['-DwarningAsError=true','-o',out,name],project,proofEnv,deadline);
 }
 const audit=checkedRun(compiler,['-DwarningAsError=true','Audit.lean'],project,proofEnv,deadline);
 if(!/Audited \d+ mathematical theorems/.test(audit))refuse('axiom-audit-missing');
 checkedRun(compiler,['-DwarningAsError=true','Negatives.lean'],project,proofEnv,deadline);
 return {compiledModules:spec.modules.length,axiomAudit:true,mathematicalNegatives:true};
}
export function receipt(asked){
 const{spec,files}=inputs(asked);
 if(asked.region!==spec.region||asked.name!==spec.scope)refuse('undeclared-reading');
 const temp=mkdtempSync(join(tmpdir(),'obligations-verification-'));
 try{
  for(const[name,text]of files){
   if(name.startsWith('/')||name.split(/[\\/]/).some(s=>s==='..')||resolve(temp,name).slice(0,temp.length+1)!==temp+'/')refuse('input-coordinate');
   const destination=join(temp,name);mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,text);
  }
  const env={PATH:process.env.PATH||'',HOME:temp,TMPDIR:temp,TEMP:temp,TZ:'UTC',LC_ALL:'C',NO_COLOR:'1'};
  const deadline=Date.now()+manifest.limits.subprocessTimeoutMs;
  let result;
  if(spec.kind==='mathematics'){
   const output=checkedRun(process.execPath,['--import','./test/setup.ts','--test','--test-reporter=tap','--test-concurrency=2',...spec.tests],temp,env,deadline);
   const count=name=>{const m=output.match(new RegExp('^# '+name+' (\\d+)$','m'));if(!m)refuse('test-accounting');return Number(m[1]);};
   const tests=count('tests'),passed=count('pass');
   if((spec.expectedTests===null?tests<1:tests!==spec.expectedTests)||passed!==tests||['fail','cancelled','skipped','todo'].some(n=>count(n)!==0))refuse('incomplete-mathematical-check');
   result={tests,passed,failed:0,skipped:0};
  }else if(spec.kind==='proofs')result=prove(spec,temp,env,deadline);
  else refuse('undeclared-check');
  return [{scope:spec.scope,role:'writes',measure:'count',bound:{kind:'interval',lo:0,hi:0}},
   {scope:spec.scope+'/result',role:'writes',measure:'result',bound:{kind:'enumerated',values:[JSON.stringify({inputs:spec.inputsDigest,...result})]}}];
 }finally{rmSync(temp,{recursive:true,force:true});}
}
