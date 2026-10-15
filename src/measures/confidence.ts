import {add,sub,div,q,rational,zero,one,pack,probability,type RationalInput} from './rational.ts';

export type DeclaredFailure=Readonly<{id:string;p:RationalInput;justification:string}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·confidence '+cause);};

/** Conditional arithmetic only: callers must justify P(failure_i) <= p_i in one
 * probability space. References are retained, not verified. No independence is
 * needed; agreement/copy counts cannot supply the missing probabilities.
 *
 * Proof for a finite family of failure events F_i in that common space:
 * 1_{union F_i} <= sum_i 1_{F_i} pointwise, even for dependent events.
 * Taking expectations gives P(union F_i) <= sum_i P(F_i) <= sum_i p_i.
 * Complementing gives P(intersection F_i^c) >= 1 - sum_i p_i; combining
 * with nonnegativity yields max(0, 1 - sum_i p_i). For the empty family,
 * the union is empty and the success intersection is the whole space, so
 * the bound is 1. A sum at or above 1 gives only the trivial bound 0.
 * A justification string records a premise; it does not establish its truth.
 */
export function unionBoundConfidence(failures:readonly DeclaredFailure[]){
  if(!Array.isArray(failures))refuse('declared failures required');
  let sum=zero;
  const names=new Set<string>();
  const declarations=Array.from(failures,failure=>{
    if(!failure||typeof failure.id!=='string'||failure.id.trim()==='')refuse('failure identity required');
    if(names.has(failure.id))refuse('duplicate failure identity');
    names.add(failure.id);
    if(typeof failure.justification!=='string'||failure.justification.trim()==='')refuse('justification reference required');
    if(failure.p===undefined||failure.p===null)refuse('declared failure probability required');
    const p=probability(failure.p);sum=add(sum,p);
    return {id:failure.id,p:pack(p),justification:failure.justification};
  });
  const trivial=sum[0]>=sum[1];
  return {model:'declared-failure-union-bound@1' as const,status:'conditional-bound' as const,
    unit:'probability' as const,conditions:['common-probability-space','each-failure-probability-justified'] as const,
    declarations,failureSum:pack(sum),value:pack(trivial?zero:sub(one,sum)),trivial,
    meaning:'lower bound for all declared events succeeding; references are not verified' as const};
}

/** Conditional lower bound for at most k failures, without independence.
 * Let N count failures. Excluding any j<=k events gives N_remaining>=k+1-j
 * whenever N>=k+1. Markov therefore bounds P(N>=k+1) by
 * sum_remaining p_i/(k+1-j). For fixed j the smallest sum excludes the j
 * largest p_i; minimize these bounds over j=0..k and cap at 1. This includes
 * the full Markov bound (j=0) and a subset union bound (j=k).
 * If k=m, at most m failures is certain. No geometric tolerance is selected,
 * no probability is inferred, and no claim of sharpness is made.
 */
export function tolerantCountConfidence(failures:readonly DeclaredFailure[],k:number){
  const base=unionBoundConfidence(failures),m=base.declarations.length;
  if(!Number.isSafeInteger(k)||k<0||k>m)refuse('allowed failure count must be an integer in 0..m');
  const ordered=base.declarations.map(entry=>({entry,p:probability(entry.p)})).sort((a,b)=>{
    const difference=a.p[0]*b.p[1]-b.p[0]*a.p[1];
    return difference>0n?-1:difference<0n?1:0;
  });
  let remaining=rational(base.failureSum),upper=k===m?zero:one;
  const candidates=[];
  if(k<m)for(let j=0;j<=k;j++){
    const threshold=k+1-j,ratio=div(remaining,q(BigInt(threshold)));
    const capped=ratio[0]>=ratio[1]?one:ratio;
    if(capped[0]*upper[1]<upper[0]*capped[1])upper=capped;
    candidates.push({excludedCount:j,threshold,remainingFailureSum:pack(remaining),failureUpperBound:pack(capped)});
    if(j<k)remaining=sub(remaining,ordered[j]!.p);
  }
  return {...base,model:'declared-failure-count-bound@1' as const,allowedFailures:k,
    totalDeclarations:m,exclusionOrder:ordered.map(({entry})=>entry.id),candidates,
    failureUpperBound:pack(upper),value:pack(sub(one,upper)),trivial:upper[0]===upper[1],
    meaning:'lower bound for at most k declared failures; references are not verified' as const};
}
