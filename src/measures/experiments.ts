import type {UnanimityModel} from './model.ts';
import {unanimityFloor} from './model.ts';
export type ExperimentPolicy=Readonly<{seed:number;trials:number}>;
export type ConditionalRate=Readonly<{events:number;falseEvents:number;rate:number|'unmeasured'}>;
/** xorshift32 is the declared reference stream; zero seed is refused. */
function stream(policy:ExperimentPolicy):()=>number {
  if(!Number.isInteger(policy.seed)||policy.seed<=0||policy.seed>0xffffffff||!Number.isSafeInteger(policy.trials)||policy.trials<1)throw new Error('REFUSE·experiment invalid seed or trial count');
  let x=policy.seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
const rate=(events:number,falseEvents:number):ConditionalRate=>({events,falseEvents,rate:events?falseEvents/events:'unmeasured'});
const wrong=(random:()=>number,n:number,bias=0):number=>random()<bias?1:1+Math.floor(random()*(n-1));
/** T5 under the handed T1 model; descriptive conditional counts, no certificate. */
export function dissentExperiment(model:UnanimityModel,k:number,policy:ExperimentPolicy):Readonly<{unanimity:ConditionalRate;majorityWithDissent:ConditionalRate}> {
  unanimityFloor(model,k);const random=stream(policy);let unanimous=0,unanimousFalse=0,majority=0,majorityFalse=0;
  for(let trial=0;trial<policy.trials;trial++){
    const common=random()<model.c;
    const counts=new Map<number,number>();
    for(let i=0;i<k;i++){const value=common?1:random()<model.p?wrong(random,model.n):0;counts.set(value,(counts.get(value)??0)+1);}
    for(const [value,count] of counts){if(count===k){unanimous++;if(value!==0)unanimousFalse++;}else if(count>k/2){majority++;if(value!==0)majorityFalse++;}}
  }
  return {unanimity:rate(unanimous,unanimousFalse),majorityWithDissent:rate(majority,majorityFalse)};
}
/** T1 private errors with an explicit interest bias; absent stake is not inferred. */
export function interestExperiment(model:UnanimityModel,bias:number,shared:boolean,policy:ExperimentPolicy):ConditionalRate {
  unanimityFloor(model,2);if(!Number.isFinite(bias)||bias<0||bias>1)throw new Error('REFUSE·experiment invalid interest bias');
  const random=stream(policy);let agreed=0,falseAgreed=0;
  for(let trial=0;trial<policy.trials;trial++){
    const common=random()<model.c;
    const a=common?1:random()<model.p?wrong(random,model.n,bias):0;
    const b=common?1:random()<model.p?wrong(random,model.n,shared?bias:0):0;
    if(a===b){agreed++;if(a!==0)falseAgreed++;}
  }
  return rate(agreed,falseAgreed);
}
