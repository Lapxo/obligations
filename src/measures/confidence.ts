import {add,sub,zero,one,pack,probability,type RationalInput} from './rational.ts';

export type DeclaredFailure=Readonly<{id:string;p:RationalInput;justification:string}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·confidence '+cause);};

/** Conditional arithmetic only: callers must justify P(failure_i) <= p_i in one
 * probability space. References are retained, not verified. No independence is
 * needed; agreement/copy counts cannot supply the missing probabilities.
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
