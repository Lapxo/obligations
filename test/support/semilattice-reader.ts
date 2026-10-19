import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {intervals} from '@lapxo/obligations/forms';

// A receipt for handed evidence and finite correspondence, not a second Lean kernel.
export const coordinates = [
  'proofs/lean/lean-toolchain', 'proofs/lean/lakefile.toml', 'proofs/lean/lake-manifest.json',
  'proofs/lean/Obligations.lean', 'proofs/lean/Obligations/Cell.lean', 'proofs/lean/Obligations/Bridge.lean',
  'src/lattice/forms.ts', 'vectors/laws/policy.json', 'vectors/laws/meet-semilattice.json',
  'samples/laws/semilattice/yes.json', 'samples/laws/semilattice/no.json',
] as const;
const scope = 'publication/evidence/semilattice';
const fail = (name:string):never => {throw Error('REFUSE·semilattice '+name);};
const sha = (text:string|Uint8Array) => 'sha256:'+createHash('sha256').update(text).digest('hex');
const equal = (a:unknown,b:unknown) => JSON.stringify(a) === JSON.stringify(b);
const check = (condition:unknown,name:string):void => {if(!condition)fail(name);};
const decode = (text:string):any => {try{return JSON.parse(text);}catch{return fail('malformed-json');}};
type Input = readonly [string,string];
type Asked = {region?:string;lines:readonly {scope:string;measure:string;about?:string}[]};

export function inspect(inputs:readonly Input[]){
  const files = new Map(inputs);
  check(files.size===inputs.length,'duplicate-input');
  const read = (p:string):string => files.get(p) ?? fail('missing-input '+p);
  for(const p of coordinates)read(p);
  const vector = decode(read('vectors/laws/meet-semilattice.json'));
  const yes = decode(read('samples/laws/semilattice/yes.json'));
  const no = decode(read('samples/laws/semilattice/no.json'));
  check(vector.id==='meet-interval-semilattice','vector-id');
  check(vector.verificationBoundary?.admission===false && vector.verificationBoundary?.signatures===0 &&
    vector.verificationBoundary?.boundNativeReceipts===false,'overstated-admission');
  check(vector.places?.independentOriginsClaimed===false,'overstated-origins');
  check(vector.sourceAnchor?.path==='src/lattice/forms.ts' && sha(read(vector.sourceAnchor.path))===vector.sourceAnchor.sha256,'source-digest');
  check(vector.publishedImplementation?.sha256===sha(readFileSync(new URL('../../node_modules/@lapxo/obligations/dist/lattice/forms.js',import.meta.url))), 'runtime-digest');
  const expectedFiles = coordinates.slice(0,6);
  check(Array.isArray(vector.proof?.files) && equal(vector.proof.files.map((f:any)=>f.path),expectedFiles),'proof-inventory');
  for(const f of vector.proof.files)check(sha(read(f.path))===f.sha256,'proof-digest '+f.path);
  check(read('proofs/lean/lean-toolchain').trim()==='leanprover/lean4:v4.19.0','toolchain');
  check(decode(read('proofs/lean/lake-manifest.json')).packages.some((p:any)=>p.name==='mathlib' && p.rev===vector.proof.mathlib),'mathlib-pin');
  check(equal(yes.bridgeDomain?.endpoints,[-1,0,1,2]) && yes.proof==='proofs/lean/Obligations/Cell.lean','sample-domain');
  check(equal(yes.claims,['commutative','associative','idempotent','narrows in the existing API preorder']) &&
    yes.context==='fixed bounds and complete context; accumulated restrictions only','contract-claims');
  check(no.name==='raw-api-antisymmetry-counterclaim' && no.expectedExit===1 && no.boundRuntimeRefusalClaimed===false,'negative-contract');
  check(equal(no.a,{lo:5,hi:3}) && equal(no.b,{lo:8,hi:6}) &&
    no.falseClaim==='the published apiLeq is antisymmetric on raw Cell values','negative-contract');
  check(vector.capturePolicy?.timeoutMs===25000 && vector.capturePolicy?.responseBytes===65536,'capture-limits');
  const operations = ['build','audit','bridge','published-js-bridge','negative'];
  const captures = vector.captures;
  check(Array.isArray(captures) && captures.length===10,'two-complete-places');
  const places = [...new Set(captures.map((c:any)=>c.place))];
  check(places.length===2 && places.every(p=>typeof p==='string' && p.length>0),'two-complete-places');
  const algebra = intervals(-1,2), endpoints = [-1,0,1,2];
  const cells = endpoints.flatMap(lo=>endpoints.map(hi=>({lo,hi})));
  const table = cells.flatMap(a=>cells.map(b=>{const m=algebra.meet(a,b);return [a.lo,a.hi,b.lo,b.hi,m.lo,m.hi,algebra.leq(a,b),!algebra.inhabited(m)];}));
  const theorems:string[] = vector.proof.auditedTheorems;
  check(Array.isArray(theorems)&&theorems.length>0&&Array.isArray(vector.proof.allowedAxioms),'theorem-inventory');
  for(const place of places){
    const events = captures.filter((c:any)=>c.place===place);
    check(events.length===5 && operations.every(op=>events.filter((c:any)=>c.operation===op).length===1),'two-complete-places');
    for(const c of events){
      check(typeof c.stdout==='string' && typeof c.stderr==='string' && sha(c.stdout)===c.stdoutSha256 && sha(c.stderr)===c.stderrSha256,'capture-bytes');
      check(Number.isFinite(c.runtimeMs) && c.runtimeMs>=0 && c.runtimeMs<=25000 &&
        Buffer.byteLength(c.stdout)+Buffer.byteLength(c.stderr)<=65536,'capture-budget');
      check(c.status===(c.operation==='negative'?1:0),'capture-exit');
    }
    const event = (op:string):any => events.find((c:any)=>c.operation===op);
    check(event('build').stdout.includes('Build completed successfully.'),'build-missing');
    const audit = event('audit').stdout.trim().split('\n');
    check(audit.length===theorems.length && theorems.every((t,i)=>{
      const prefix="'Obligations.Cell."+t+"' depends on axioms: [";
      if(!audit[i].startsWith(prefix)||!audit[i].endsWith(']'))return false;
      return audit[i].slice(prefix.length,-1).split(', ').every((a:string)=>vector.proof.allowedAxioms.includes(a));
    }),'untrusted-axiom-audit');
    check(equal(decode(event('bridge').stdout),table),'bridge-mismatch');
    const js = decode(event('published-js-bridge').stdout);
    check(js.publishedVersion==='0.4.3' && js.pairs===256 && js.associativityTriples===4096 &&
      js.tableSha256===sha(event('bridge').stdout) && js.leanTableMatchesPublishedJavaScript===true,'published-bridge');
    check(event('negative').stdout.includes("tactic 'decide' proved that the proposition") &&
      event('negative').stdout.includes('{ lo := 5, hi := 3 } = { lo := 8, hi := 6 }') &&
      event('negative').stdout.includes('is false'),'negative-missing');
  }
  for(const a of cells){
    check(equal(algebra.meet(a,a),a),'idempotence');
    for(const b of cells){
      const m=algebra.meet(a,b);
      check(equal(m,algebra.meet(b,a)) && algebra.leq(m,a) && algebra.leq(m,b),'meet-or-narrowing');
      for(const c of cells)check(equal(algebra.meet(m,c),algebra.meet(a,algebra.meet(b,c))),'associativity');
    }
  }
  check(algebra.leq(no.a,no.b) && algebra.leq(no.b,no.a) && !equal(no.a,no.b),'raw-antisymmetry-counterexample');
  return [{scope,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}}];
}

export function receipt(asked:Asked){
  const inputs=asked.lines.filter(l=>l.measure==='text' && l.about!==undefined).map(l=>[l.scope,l.about!] as const);
  return asked.region==='lean-kernel' ? executeLean(inputs,process.cwd()) : inspect(inputs);
}

const leanProcess:LeanProcess=(command,args,options)=>{const r=spawnSync(command,[...args],{...options,encoding:'utf8',shell:false});return {status:r.status,stdout:r.stdout??'',stderr:r.stderr??'',error:r.error,signal:r.signal};};

/** The same reader executes the declared proof region; the historical capture
 * region above remains a different reading. Dependency installation is a fixture. */
export type LeanProcess = (command:string,args:readonly string[],options:{cwd:string;timeout:number;maxBuffer:number}) => {status:number|null;stdout:string;stderr:string;error?:Error;signal?:string|null};
export function auditLeanAxioms(output:string,names:readonly string[],allowed:readonly string[]){
  const rows=output.trim().split('\n');
  check(rows.length===names.length,'incomplete-axiom-audit');
  for(let i=0;i<names.length;i++){
    const row=rows[i]!,name=names[i]!;
    if(row===`'${name}' does not depend on any axioms`)continue;
    const prefix=`'${name}' depends on axioms: [`;
    check(row.startsWith(prefix)&&row.endsWith(']'),'malformed-axiom-audit');
    check(row.slice(prefix.length,-1).split(', ').every(a=>allowed.includes(a)),'unapproved-axiom');
  }
}
export function judgeLeanNegative(result:{status:number|null;stdout:string;stderr:string},negative:{exitCode:number;cause:readonly string[]}){
  check(negative.exitCode===1&&negative.cause.length>0,'negative-contract');
  check(result.status===negative.exitCode,'negative-accepted');
  check(negative.cause.every(c=>(result.stdout+result.stderr).includes(c)),'negative-wrong-cause');
}
export function executeLean(inputs:readonly Input[],root:string,run:LeanProcess=leanProcess){
  const files=new Map(inputs);check(files.size===inputs.length,'duplicate-input');
  const read=(p:string):string=>files.get(p)??fail('missing-input '+p);
  const vector=decode(read('vectors/laws/meet-semilattice.json')),policy=vector.execution;
  check(policy?.profile==='lean-kernel@1'&&policy.project==='proofs/lean','execution-profile');
  const expectedInputs=[...vector.proof.files.map((f:{path:string})=>f.path),
    'proofs/lean/Obligations/HellyComb.lean','vectors/laws/meet-semilattice.json','vectors/laws/helly-comb.lean.json'];
  check(equal(policy.identityInputs,expectedInputs),'execution-input-inventory');
  const project=resolve(root,policy.project);
  // Read and identify every handed source before starting the compiler.
  for(const p of expectedInputs){
    const text=read(p);check(readFileSync(resolve(root,p),'utf8')===text,'fixture-source-differs '+p);
  }
  for(const f of vector.proof.files)check(sha(read(f.path))===f.sha256,'proof-digest '+f.path);
  check(read('proofs/lean/lean-toolchain').trim()===policy.toolchain,'toolchain');
  const helly=decode(read(policy.hellyVector));
  check(helly.execution?.profile===policy.profile&&sha(read(helly.source))===helly.sourceSha256,'helly-source-digest');
  const manifest=decode(read('proofs/lean/lake-manifest.json'));
  check(manifest.packages.some((p:any)=>p.name==='mathlib'&&p.rev===vector.proof.mathlib),'mathlib-pin');
  check(manifest.packages.every((p:any)=>/^[A-Za-z0-9_-]+$/.test(p.name)&&/^[a-f0-9]{40}$/.test(p.rev)),'dependency-revision');
  check(vector.capturePolicy.timeoutMs===25000&&vector.capturePolicy.responseBytes===65536,'capture-limits');
  const events:{operation:string;command:string;args:readonly string[];status:number;stdout:string;stderr:string;stdoutSha256:string;stderrSha256:string}[]=[];
  const temporary=mkdtempSync(join(tmpdir(),'obligations-lean-'));
  const projectOutput=(text:string)=>text.split(project+'/').join('').split(temporary+'/').join('');
  const call=(operation:string,command:string,args:readonly string[],expected=0)=>{
    const started=performance.now(),r=run(command,args,{cwd:project,timeout:vector.capturePolicy.timeoutMs,maxBuffer:vector.capturePolicy.responseBytes});
    check(!r.error&&!r.signal,'process-failed '+operation);
    check(Buffer.byteLength(r.stdout)+Buffer.byteLength(r.stderr)<=vector.capturePolicy.responseBytes,'response-budget '+operation);
    check(r.status===expected,'process-exit '+operation);
    events.push({operation,command,args:args.map(projectOutput),status:r.status!,stdout:projectOutput(r.stdout),stderr:projectOutput(r.stderr),stdoutSha256:sha(r.stdout),stderrSha256:sha(r.stderr)});
    process.stderr.write(`LEAN executed · ${operation} · ${Math.round(performance.now()-started)} ms\n`);
    return r;
  };
  try{
    const version=call('compiler-version','lean',['--version']);
    check(version.stdout.includes(policy.compilerIdentity)&&version.stdout.includes(policy.toolchain.split(':').at(-1).slice(1)),'compiler-version');
    call('lake-version','lake',['--version']);
    for(const p of manifest.packages){
      check(existsSync(join(project,'.lake/packages',p.name)),'fixture-dependency-absent '+p.name);
      const actual=call('dependency/'+p.name,'git',['-C','.lake/packages/'+p.name,'rev-parse','HEAD']);
      check(actual.stdout.trim()===p.rev,'dependency-revision '+p.name);
      const changed=call('dependency-clean/'+p.name,'git',['-C','.lake/packages/'+p.name,'status','--porcelain','--untracked-files=no']);
      check(changed.stdout.trim()==='','dependency-dirty '+p.name);
    }
    // No installation command, update or dependency download belongs to this reading.
    check(equal(policy.targets,['Obligations','Obligations.HellyComb']),'build-targets');
    call('build','lake',['build',...policy.targets]);
    for(const source of policy.sources){
      check(expectedInputs.includes(policy.project+'/'+source),'undeclared-build-source');
      call('compile/'+source,'lake',['env','lean','-DwarningAsError=true',source]);
    }
    const cellNames=vector.proof.auditedTheorems.map((n:string)=>'Obligations.Cell.'+n);
    const audits=[{names:cellNames,allowed:vector.proof.allowedAxioms},{names:helly.execution.auditedTheorems,allowed:helly.execution.allowedAxioms}];
    check(audits.every(a=>Array.isArray(a.allowed)&&a.names.length>0&&a.names.every((n:string)=>/^[A-Za-z0-9_.]+$/.test(n))),'axiom-policy');
    const names=audits.flatMap(a=>a.names),audit=join(temporary,'audit.lean');
    writeFileSync(audit,'import Obligations.Cell\nimport Obligations.HellyComb\n'+names.map(n=>'#print axioms '+n+'\n').join(''));
    const printed=call('axiom-audit','lake',['env','lean','-DwarningAsError=true',audit]);
    const rows=printed.stdout.trim().split('\n');let offset=0;
    for(const a of audits){auditLeanAxioms(rows.slice(offset,offset+a.names.length).join('\n'),a.names,a.allowed);offset+=a.names.length;}
    check(offset===rows.length,'extra-axiom-report');
    for(const negative of [policy.negative,helly.execution.negative]){
      check(/^[a-z-]+$/.test(negative.name)&&typeof negative.source==='string','negative-contract');
      const at=join(temporary,negative.name+'.lean');writeFileSync(at,negative.source);
      const result=call('negative/'+negative.name,'lake',['env','lean',at],1);judgeLeanNegative(result,negative);
    }
    const transcript={profile:policy.profile,inputs:expectedInputs.map(p=>[p,sha(read(p))]),toolchain:policy.toolchain,
      dependencies:manifest.packages.map((p:any)=>({name:p.name,revision:p.rev})),events};
    process.stderr.write('LEAN transcript · '+sha(JSON.stringify(transcript))+' · '+JSON.stringify(transcript)+'\n');
    const verified={profile:policy.profile,inputs:transcript.inputs,toolchain:policy.toolchain,dependencies:transcript.dependencies,axioms:audits,negatives:[policy.negative,helly.execution.negative]};
    return [{scope:'publication/evidence/lean',role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}},
      {scope:'publication/evidence/lean/verification',role:'writes' as const,measure:'digest',bound:{kind:'enumerated' as const,values:[sha(JSON.stringify(verified))]}}];
  }finally{rmSync(temporary,{recursive:true,force:true});}
}
