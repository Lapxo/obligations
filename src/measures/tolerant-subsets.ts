import {unionBoundConfidence,type DeclaredFailure} from './confidence.ts';
import {add,sub,mul,q,rational,zero,one,pack,type Q} from './rational.ts';

const refuse=(cause:string):never=>{throw new Error('REFUSE·L7 '+cause);};
function inputs(failures:readonly DeclaredFailure[],k:number,probabilitySpace:string){
  if(typeof probabilitySpace!=='string'||probabilitySpace.trim()==='')refuse('common-probability-space-required');
  const base=unionBoundConfidence(failures),m=base.declarations.length;
  if(!Number.isSafeInteger(k)||k<0||k>m)refuse('allowed-failure-count-outside-0..m');
  return {base,m};
}
function choose(n:number,k:number):bigint {
  if(k>n)return 0n;
  let c=1n;for(let j=1;j<=Math.min(k,n-k);j++)c=c*BigInt(n-j+1)/BigInt(j);
  return c;
}
/** Conditional union bound on all (k+1)-fold intersections. Each intersection
 * has mass at most its smallest declared marginal. No independence is assumed.
 * Sorting assigns each subset to its first member, so its contribution is
 * p[j] * choose(m-j-1,k). Equal probabilities do not change the sum.
 * A probability-space identifier and references are retained, never verified.
 * This additional bound does not replace the stronger 0.4.2 count bound.
 */
export function tolerantSubsetConfidence(failures:readonly DeclaredFailure[],k:number,probabilitySpace:string){
  const {base,m}=inputs(failures,k,probabilitySpace);
  const ordered=base.declarations.map(entry=>({entry,p:rational(entry.p)})).sort((a,b)=>{
    const d=a.p[0]*b.p[1]-b.p[0]*a.p[1];return d<0n?-1:d>0n?1:0;
  });
  let sum:Q=zero;
  const terms=k===m?[]:ordered.slice(0,m-k).map(({entry,p},j)=>{
    const coefficient=choose(m-j-1,k),contribution=mul(p,q(coefficient));sum=add(sum,contribution);
    return {id:entry.id,subsets:String(coefficient),contribution:pack(contribution)};
  });
  const trivial=sum[0]>=sum[1],upper=trivial?one:sum;
  return {model:'declared-failure-subset-bound@1' as const,status:'conditional-bound' as const,
    unit:'probability' as const,probabilitySpace,declarations:base.declarations,
    allowedFailures:k,totalDeclarations:m,conditions:['common-probability-space','declared-marginal-upper-bounds'] as const,
    referencesVerified:false as const,terms,uncappedFailureBound:pack(sum),failureUpperBound:pack(upper),
    value:pack(sub(one,upper)),trivial};
}

export type JointIndependenceDeclaration=Readonly<{
  probabilitySpace:string;jointIndependence:true;justification:string;
}>;
/** Exact Bernoulli convolution only under a declaration of joint independence.
 * Correlation values, pairwise independence and common-cause weights cannot
 * substitute for that declaration. Marginal p_i remain upper bounds: this
 * convolution gives a tail upper bound by monotonicity, not inferred frequency.
 */
export function independentCountConfidence(failures:readonly DeclaredFailure[],k:number,declaration:JointIndependenceDeclaration){
  if(!declaration||declaration.jointIndependence!==true)refuse('joint-independence-required');
  if(typeof declaration.justification!=='string'||declaration.justification.trim()==='')refuse('joint-independence-justification-required');
  const {base,m}=inputs(failures,k,declaration.probabilitySpace);
  let distribution:Q[]=[one];
  for(const entry of base.declarations){
    const p=rational(entry.p),next:Q[]=Array.from({length:distribution.length+1},()=>zero);
    for(let j=0;j<distribution.length;j++){
      next[j]=add(next[j]!,mul(distribution[j]!,sub(one,p)));
      next[j+1]=add(next[j+1]!,mul(distribution[j]!,p));
    }
    distribution=next;
  }
  const upper=distribution.slice(k+1).reduce(add,zero);
  return {model:'declared-joint-independent-count-bound@1' as const,status:'conditional-bound' as const,
    unit:'probability' as const,probabilitySpace:declaration.probabilitySpace,declarations:base.declarations,
    allowedFailures:k,totalDeclarations:m,jointIndependence:{declared:true as const,justification:declaration.justification},
    referencesVerified:false as const,bernoulliEnvelope:distribution.map(pack),failureUpperBound:pack(upper),
    value:pack(sub(one,upper)),trivial:upper[0]===upper[1]};
}
