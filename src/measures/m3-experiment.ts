import {validateM3,type ModelM3} from './m3.ts';
import {probability,refuse,type Q} from './rational.ts';
export type M3ExperimentPolicy=Readonly<{prng:'xorshift32';seed:number;trials:number;randomWords:number}>;
/** Controlled procedure; the seed and finite stream are conditions, never an empirical law. */
export function experimentM3(model:ModelM3,policy:M3ExperimentPolicy){
 validateM3(model);
 if(!policy||policy.prng!=='xorshift32'||!Number.isInteger(policy.seed)||policy.seed<=0||policy.seed>0xffffffff||!Number.isSafeInteger(policy.trials)||policy.trials<1||!Number.isSafeInteger(policy.randomWords)||policy.randomWords<0)refuse('invalid experiment policy');
 const metadata={model:'M/3' as const,parameters:model,policy,conditions:['controlled-simulation','declared-xorshift32-stream','exact-rational-event-sampling','not-a-law'] as const};
 let x=policy.seed>>>0,words=0;const exhausted=Symbol('experiment/random-words');
 const word=()=>{if(words===policy.randomWords)throw exhausted;words++;x^=x<<13;x^=x>>>17;x^=x<<5;return BigInt(x>>>0);};
 const below=(n:bigint)=>{if(n===1n)return 0n;const bits=BigInt((n-1n).toString(2).length),mask=(1n<<bits)-1n;for(;;){let r=0n;for(let b=0n;b<bits;b+=32n)r=(r<<32n)|word();r&=mask;if(r<n)return r;}};
 const bernoulli=(p:Q)=>p[0]===0n?false:p[0]===p[1]?true:below(p[1])<p[0];
 const factors=[...model.factors].filter(f=>f.members.some(id=>model.selection.includes(id))).sort((a,b)=>a.index-b.index);
 const c=factors.map(f=>probability(f.probability)),p=model.selection.map(id=>probability(model.witnesses.find(w=>w.id===id)!.privateError!)),k=model.selection.length;
 const counts={true:0,false:0,fired:0,dissent:0,majorityTrue:0,majorityFalse:0,majorityNone:0};
 try{for(let trial=0;trial<policy.trials;trial++){
  const governors=model.selection.map(()=>-1);let fired=false;
  factors.forEach((f,i)=>{if(bernoulli(c[i]!)){fired=true;model.selection.forEach((id,j)=>{if(governors[j]===-1&&f.members.includes(id))governors[j]=i;});}});
  const labels=new Map<number,number>(),values=new Map<number,number>();
  const wrong=()=>Number(below(BigInt(model.cardinality-1)))+1;
  governors.forEach((g,i)=>{let value=0;if(g!==-1){if(!labels.has(g))labels.set(g,wrong());value=labels.get(g)!;}else if(bernoulli(p[i]!))value=wrong();values.set(value,(values.get(value)??0)+1);});
  if(values.size===1){if(values.has(0))counts.true++;else{counts.false++;if(fired)counts.fired++;}}
  else{counts.dissent++;if(2*(values.get(0)??0)>k)counts.majorityTrue++;else if([...values].some(([value,count])=>value!==0&&2*count>k))counts.majorityFalse++;else counts.majorityNone++;}
 }}catch(error){if(error!==exhausted)throw error;return {...metadata,status:'unmeasured' as const,cause:'experiment/random-words',words};}
 const conditional=(numerator:number,denominator:number)=>({numerator,denominator,rate:denominator?numerator/denominator:'unmeasured' as const});
 return {...metadata,status:'measured' as const,words,counts,unanimity:conditional(counts.false,counts.true+counts.false),falseMajorityGivenDissent:conditional(counts.majorityFalse,counts.dissent),falseMajorityGivenMajorityAndDissent:conditional(counts.majorityFalse,counts.majorityTrue+counts.majorityFalse)};
}
