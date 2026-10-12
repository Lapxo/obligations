import {probability,type RationalInput} from '../../src/measures/rational.ts';
import type {UnanimityCurve,UnanimityGroup} from '../../src/measures/unanimity-fit.ts';
export type UnanimityExperiment=Readonly<{model:'single-dominant-factor@1';n:number;c:RationalInput;p:RationalInput;
  lineage:string;sizes:readonly number[];prng:'xorshift32';seed:number;trials:number;randomWords:number}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·unanimity experiment '+cause);};
/** A controlled world's generator, not an operation exported by the library. */
export function unanimityExperiment(input:UnanimityExperiment){
  if(!input||input.model!=='single-dominant-factor@1'||!Number.isSafeInteger(input.n)||input.n<2||input.n>4294967296||
    !input.lineage||!Array.isArray(input.sizes)||!input.sizes.length||new Set(input.sizes).size!==input.sizes.length||
    input.sizes.some(k=>!Number.isSafeInteger(k)||k<1)||input.prng!=='xorshift32'||!Number.isInteger(input.seed)||input.seed<1||
    input.seed>0xffffffff||!Number.isSafeInteger(input.trials)||input.trials<1||!Number.isSafeInteger(input.randomWords)||input.randomWords<0)
    refuse('invalid declared procedure');
  const c=probability(input.c),p=probability(input.p);
  if(c[1]>4294967296n||p[1]>4294967296n)refuse('probability denominator exceeds PRNG index range');
  const sizes=[...input.sizes].sort((a,b)=>a-b),max=sizes[sizes.length-1]!;
  const minimum=BigInt(input.trials)*2n;
  const metadata={procedure:input,truth:'fixed zero by label symmetry' as const,minimumWords:String(minimum)};
  if(minimum>BigInt(input.randomWords))return {...metadata,status:'unmeasured' as const,cause:'experiment/random-words'};
  let x=input.seed>>>0,words=0;
  const exhausted=Symbol('experiment/random-words');
  const integer=(N:number)=>{
    const limit=Math.floor(4294967296/N)*N;
    for(;;){if(words>=input.randomWords)throw exhausted;words++;x^=x<<13;x^=x>>>17;x^=x<<5;const v=x>>>0;if(v<limit)return v%N;}
  };
  const event=(rate:readonly [bigint,bigint])=>BigInt(integer(Number(rate[1])))<rate[0];
  const groups:UnanimityGroup[]=[],counts=sizes.map(k=>({k,unanimous:0,trials:input.trials}));
  try{for(let i=0;i<input.trials;i++){
    const forced=event(c),wrong=forced?1+integer(input.n-1):0;
    const votes=Array.from({length:max},()=>forced?wrong:event(p)?1+integer(input.n-1):0);
    const outcomes=sizes.map((k,j)=>{const unanimous=votes.slice(0,k).every(v=>v===votes[0]);if(unanimous)counts[j]!.unanimous++;return {k,unanimous};});
    groups.push({id:String(i).padStart(String(input.trials).length,'0'),outcomes});
  }}catch(error){if(error!==exhausted)throw error;return {...metadata,status:'unmeasured' as const,cause:'experiment/random-words',words};}
  const curve:UnanimityCurve={n:input.n,lineage:input.lineage,counts,groups};
  return {...metadata,status:'measured' as const,words,curve};
}
