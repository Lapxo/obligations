import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
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
type Asked = {lines:readonly {scope:string;measure:string;about?:string}[]};

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
  const theorems = ['meet_comm','meet_assoc','meet_idem','meaning_meet','apiLeq_iff_subset',
    'meet_narrows_left','meet_narrows_right','mutually_narrows_iff','observe_meet','observe_order',
    'crossed_pairs_not_antisymmetric','permutation_invariant','duplicate_in_replay'];
  check(equal(vector.proof.auditedTheorems,theorems),'theorem-inventory');
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
      return audit[i].slice(prefix.length,-1).split(', ').every((a:string)=>['propext','Quot.sound','Classical.choice'].includes(a));
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
  return inspect(asked.lines.filter(l=>l.measure==='text' && l.about!==undefined).map(l=>[l.scope,l.about!] as const));
}
