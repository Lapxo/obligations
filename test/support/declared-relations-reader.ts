import {chain,withdrawsExactly} from '../../dist/lattice/index.js';
import {add,sub,mul,div,pow,equal,rational,pack,zero,one,type Q} from '../../src/measures/rational.ts';
const fail=(s:string):never=>{throw Error('REFUSE·declared-relations/'+s)};
const check=(x:unknown,s:string):void=>{if(!x)fail(s)};
const q=(x:any):Q=>{try{return rational(x)}catch{return fail('invalid-rational')}};
const sum=(xs:Q[]):Q=>xs.reduce(add,zero),mean=(xs:Q[]):Q=>div(sum(xs),q(String(xs.length)));
const lt=(a:Q,b:Q)=>a[0]*b[1]<b[0]*a[1],nonneg=(a:Q)=>!lt(a,zero);
const vector=(a:any):Q[]=>{check(Array.isArray(a)&&a.length>0,'nonempty-vector');return a.map(q)};
const matrix=(a:any):Q[][]=>{check(Array.isArray(a)&&a.length>0,'nonempty-matrix');const rows:Q[][]=a.map(vector);check(rows.every(r=>r.length===rows[0].length),'matrix-dimension');return rows};
const dot=(x:Q[],y:Q[])=>{check(x.length===y.length,'dot-dimension');return sum(x.map((a,i)=>mul(a,y[i]!)))};
const covariance=(x:Q[],y:Q[])=>sub(mean(x.map((a,i)=>mul(a,y[i]!))),mul(mean(x),mean(y)));
const json=(files:Map<string,string>,p:string)=>{const text=files.get(p);if(text===undefined)fail('missing-input '+p);try{return JSON.parse(text!)}catch{return fail('malformed-json '+p)}};

export function evaluate(region:string,input:any,files:Map<string,string>):unknown {
 if(region==='withdrawal-witness'){
  check(input.evidenceGrantsAuthority===false,'withdrawal/evidence-not-authority');check(input.claim==='retained-family-required','withdrawal/aggregate-is-lossy');
  const scale=chain(['none','all']);check(withdrawsExactly(scale),'withdrawal/shape');
  const meet=(values:number[])=>values.reduce((a,b)=>scale.lower(a,b),scale.topIx);
  const result=input.families.map((family:any[])=>{check(Array.isArray(family)&&family.length>=2,'withdrawal/complete-family');check(new Set(family.map(f=>f.id)).size===family.length,'withdrawal/duplicate-contribution');check(family.filter(f=>f.id===input.removedId).length===1&&family.every(f=>[0,1].includes(f.level)),'withdrawal/identified-contribution');return{aggregate:meet(family.map(f=>f.level)),remaining:meet(family.filter(f=>f.id!==input.removedId).map(f=>f.level))}});
  check(result.length===2&&result[0].aggregate===result[1].aggregate&&result[0].remaining!==result[1].remaining,'withdrawal/counterexample');return{distributiveShape:true,results:result,removed:input.removedId,recoverableFromAggregate:false,authority:'not-inferred'};
 }
 if(region==='linear-influence'){
  check(input.claims==='declared-rational-identities'&&Array.isArray(input.cases),'influence/declared-claim');
  return input.cases.map((c:any)=>{
   if(c.kind==='transport'){
    check(c.noise==='zero'&&c.scale==='linear','influence/noiseless-linear-domain');const x=vector(c.x),a=vector(c.alpha),W=matrix(c.W),n=x.length;check(a.length===n&&W.length===n&&W.every(r=>r.length===n),'influence/dimension');check(a.every(v=>nonneg(v)&&!lt(one,v))&&W.every(row=>row.every(nonneg)&&equal(sum(row),one)),'influence/stochastic-domain');
    const after=x.map((xi,i)=>add(mul(sub(one,a[i]!),xi),mul(a[i]!,dot(W[i]!,x))));const cols=x.map((_,j)=>sum(W.map(row=>row[j]!)));const homogeneous=a.every(ai=>equal(ai,a[0]!));const drift=sub(mean(after),mean(x));if(homogeneous)check(equal(drift,mul(a[0]!,covariance(cols,x))),'influence/column-identity');let weighted:any=undefined;if(c.stationaryProbability){const weights=vector(c.stationaryProbability);check(weights.length===n&&weights.every(nonneg)&&equal(sum(weights),one),'influence/stationary-domain');check(x.every((_,j)=>equal(sum(weights.map((w,i)=>mul(w,W[i]![j]!))),weights[j]!)),'influence/stationary-condition');check(homogeneous,'influence/homogeneous-weighted-domain');check(equal(dot(weights,after),dot(weights,x)),'influence/weighted-identity');weighted={before:pack(dot(weights,x)),after:pack(dot(weights,after))};}const complete=W.every(row=>row.every(v=>equal(v,div(one,q(String(n))))));if(complete)check(equal(drift,sub(zero,covariance(a,x))),'influence/complete-identity');return{id:c.id,meanBefore:pack(mean(x)),meanAfter:pack(mean(after)),drift:pack(drift),columnSums:cols.map(pack),homogeneous,complete,...(weighted?{weighted}: {})};
   }
   if(c.kind==='gram-correlation'){
    const B=matrix(c.B),Sigma=B.map(row=>B.map(other=>dot(row,other))),trace=sum(Sigma.map((row,i)=>row[i]!)),denom=sum(Sigma.map(sum));check(nonneg(denom),'influence/gram-denominator');return{id:c.id,covariance:Sigma.map(row=>row.map(pack)),trace:pack(trace),denominator:pack(denom),size:equal(denom,zero)?{status:'unmeasured',cause:'zero variance of sum'}:{status:'measured',value:pack(div(mul(q(String(B.length)),trace),denom))}};
   }
   if(c.kind==='complete-covariance'){
    check(Number.isSafeInteger(c.n)&&c.n>=1&&Number.isSafeInteger(c.steps)&&c.steps>=0,'influence/covariance-domain');const a=q(c.alpha),s=q(c.variance);check(nonneg(a)&&!lt(one,a)&&lt(zero,s),'influence/covariance-domain');const n=q(String(c.n)),r=pow(sub(one,a),c.steps),v=pow(r,2);const Sigma=Array.from({length:c.n},(_,i)=>Array.from({length:c.n},(_,j)=>mul(s,add(div(one,n),mul(v,sub(i===j?one:zero,div(one,n)))))));const tr=sum(Sigma.map((row,i)=>row[i]!)),denom=sum(Sigma.map(sum)),size=div(mul(n,tr),denom),expected=add(one,mul(sub(n,one),v));check(equal(size,expected),'influence/covariance-normalization');return{id:c.id,steps:c.steps,size:pack(size),trace:pack(tr),denominator:pack(denom),proofBoundary:'scalar identity; covariance derivation separately stated'};
   }
   return fail('influence/undeclared-member');
  });
 }
 if(region==='copy-threshold-boundaries'){
  check(input.uniformBoundStatus==='Lean-open','threshold/unproved-uniform-bound');const p=q(input.p),c=q(input.c);check(lt(q('1/2'),p)&&lt(p,one)&&nonneg(c)&&!lt(one,c),'threshold/domain');const gap=sub(mul(sub(one,c),sub(mul(q('2'),p),one)),c),threshold=sub(one,div(one,mul(q('2'),p)));check(lt(zero,gap)===lt(c,threshold),'threshold/gap-identity');
  const cases=input.cases.map((m:any)=>{check(m.jointLaw==='product-bernoulli@1','threshold/joint-law-required');check(m.tie==='fair','threshold/fair-tie-required');const weights=vector(m.weights),p=q(m.p);check(nonneg(p)&&!lt(one,p),'threshold/probability');check(weights.length===m.K&&weights.every(w=>lt(zero,w))&&equal(sum(weights),one),'threshold/weights');const seen=new Set<string>();let mass=zero,error=zero;for(const row of m.atoms){check(Array.isArray(row.bits)&&row.bits.length===m.K&&row.bits.every((x:any)=>x===0||x===1),'threshold/atom');const key=row.bits.join('');check(!seen.has(key),'threshold/duplicate-atom');seen.add(key);const joint=row.bits.map((bit:number)=>bit?p:sub(one,p)).reduce(mul,one),pr=q(row.p);check(equal(joint,pr),'threshold/product-law-differs');mass=add(mass,pr);const correct=sum(weights.map((w,i)=>row.bits[i]?w:zero)),loss=lt(correct,q('1/2'))?one:equal(correct,q('1/2'))?q('1/2'):zero;error=add(error,mul(pr,loss));}check(seen.size===2**m.K&&equal(mass,one),'threshold/complete-pmf');return{K:m.K,weights:weights.map(pack),tie:'fair',error:pack(error)}});return{gap:pack(gap),threshold:pack(threshold),cases,uniformConcentration:'Lean-open'};
 }
 if(region==='decision-estimation'){
  check(Array.isArray(input.losses)&&input.losses.length>0,'decision/missing-loss');check(input.tie==='all-minimizers'&&input.lossUnit&&input.estimateUnit,'decision/unit-or-tie');const prior=vector(input.prior);check(prior.length===input.states.length&&prior.every(nonneg)&&equal(sum(prior),one),'decision/prior');check(new Set(input.states).size===input.states.length&&new Set(input.actions).size===input.actions.length,'decision/names');return input.losses.map((table:any)=>{const loss=matrix(table);check(loss.length===input.actions.length&&loss.every(row=>row.length===prior.length&&row.every(nonneg)),'decision/loss-domain');const risks=loss.map(row=>dot(row,prior)),best=risks.reduce((a,b)=>lt(a,b)?a:b);return{risks:risks.map(pack),minimizers:input.actions.filter((_:any,i:number)=>equal(risks[i]!,best)),lossUnit:input.lossUnit,authority:'not-inferred'}});
 }
 return fail('undeclared-relation');
}
