import {add,equal,pack,probability,zero,type Q,type RationalInput} from './rational.ts';
export type ConditionalEvidence=Readonly<{model:'finite-conditional-evidence@1';truth:Readonly<{positive:string;negative:string}>;
 sources:readonly string[];configurations:readonly Readonly<{id:string;values:readonly string[]}>[];
 positive?:readonly RationalInput[];negative?:readonly RationalInput[];referenceSource?:string}>;
export type EvidencePolicy=Readonly<{logarithm:'binary64-log2';budget:string;minimumPositiveBits:number}>;
const fail=(cause:string):never=>{throw Error('REFUSE·evidence/'+cause)};
const unique=(xs:readonly string[])=>xs.length>0&&xs.every(x=>typeof x==='string'&&x.length>0)&&new Set(xs).size===xs.length;
/** KL(P(X|positive)||P(X|negative)) divided by the same oriented divergence
 * of an explicitly named source marginal. No independence or error rate is inferred. */
export function normalizedEvidence(model:ConditionalEvidence,policy:EvidencePolicy){
 if(!model||model.model!=='finite-conditional-evidence@1'||!model.positive||!model.negative||!model.truth)return {status:'unmeasured' as const,cause:'evidence/conditional-laws-required'};
 if(!model.referenceSource)return {status:'unmeasured' as const,cause:'evidence/reference-required'};
 if(!policy||policy.logarithm!=='binary64-log2'||typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget)||!Number.isFinite(policy.minimumPositiveBits)||policy.minimumPositiveBits<=0)fail('numeric-policy-required');
 if(!Array.isArray(model.sources)||!unique(model.sources)||!model.sources.includes(model.referenceSource)||!Array.isArray(model.configurations)||!unique(model.configurations.map(c=>c?.id))||!unique([model.truth.positive,model.truth.negative]))fail('declared-domain-required');
 const n=model.configurations.length;if(model.configurations.some(c=>!Array.isArray(c.values)||c.values.length!==model.sources.length||c.values.some(v=>typeof v!=='string'||!v))||new Set(model.configurations.map(c=>JSON.stringify(c.values))).size!==n)fail('configuration-domain');
 if(!Array.isArray(model.positive)||!Array.isArray(model.negative)||model.positive.length!==n||model.negative.length!==n)fail('conditional-support');
 const P=model.positive.map(probability),Q0=model.negative.map(probability);
 if(!equal(P.reduce(add,zero),[1n,1n])||!equal(Q0.reduce(add,zero),[1n,1n]))fail('conditional-normalization');
 const work=BigInt(n)*BigInt(model.sources.length+4);if(work>BigInt(policy.budget))return {status:'unmeasured' as const,cause:'evidence/budget',required:String(work),workUnit:'declared-support-scans' as const};
 const ri=model.sources.indexOf(model.referenceSource),groups=new Map<string,{p:Q;q:Q}>();
 model.configurations.forEach((c,i)=>{const key=c.values[ri]!,g=groups.get(key)??{p:zero,q:zero};groups.set(key,{p:add(g.p,P[i]!),q:add(g.q,Q0[i]!)})});
 const kl=(ps:readonly Q[],qs:readonly Q[])=>{
  if(ps.every((p,i)=>equal(p,qs[i]!)))return {status:'measured' as const,bits:0};
  let bits=0,correction=0;
  for(let i=0;i<ps.length;i++){
   const p=ps[i]!,q=qs[i]!;if(p[0]===0n)continue;if(q[0]===0n)return {status:'unmeasured' as const,cause:'evidence/incompatible-support'};
   const pn=Number(p[0])/Number(p[1]),qn=Number(q[0])/Number(q[1]),ratio=pn/qn;
   if(!Number.isFinite(pn)||!Number.isFinite(qn)||!Number.isFinite(ratio)||pn<=0||qn<=0||ratio<=0)return {status:'unmeasured' as const,cause:'evidence/numeric-range'};
   const term=pn*Math.log2(ratio)-correction,next=bits+term;correction=(next-bits)-term;bits=next;
  }
  if(!Number.isFinite(bits)||bits<policy.minimumPositiveBits)return {status:'unmeasured' as const,cause:'evidence/numerically-unresolved'};
  return {status:'measured' as const,bits};
 };
 const entries=[...groups.values()],reference=kl(entries.map(g=>g.p),entries.map(g=>g.q));if(reference.status!=='measured')return reference;
 if(reference.bits===0)return {status:'unmeasured' as const,cause:'evidence/zero-reference-divergence'};
 const group=kl(P,Q0);if(group.status!=='measured')return group;
 const value=group.bits/reference.bits;if(!Number.isFinite(value))return {status:'unmeasured' as const,cause:'evidence/numeric-range'};
 return {status:'measured' as const,model:model.model,parameters:model,policy,unit:'reference-source-equivalents' as const,approximation:'binary64-log2' as const,
  orientation:'positive-to-negative' as const,groupBits:group.bits,referenceBits:reference.bits,value,workUnit:'declared-support-scans' as const,required:String(work),
  meaning:'normalized evidence under two supplied conditional laws and one named reference; no universal bound by source count, factorization, accuracy or authority' as const};
}
