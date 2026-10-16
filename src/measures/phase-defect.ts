import type {LogarithmPolicy} from './capacity.ts';

export type PhaseDefectInterpretation='phase-defect'|'information';
const refuse=(cause:string):never=>{throw new Error('REFUSE·phase-defect '+cause);};
function domain(n:number,p:number,policy:LogarithmPolicy){
  if(!Number.isSafeInteger(n)||n<1||!Number.isSafeInteger(p)||p<1||n%p!==0)
    refuse('positive integer divisor domain required');
  if(!policy||policy.logarithm!=='binary64-log2')refuse('logarithm policy required');
}
function shift(p:number,s:number){
  if(!Number.isSafeInteger(s)||s<0||s>=p)refuse('integer shift domain required');
}
function binaryEntropy(t:number):number {
  return t===0||t===1?0:-t*Math.log2(t)-(1-t)*Math.log2(1-t);
}
/** F4 arithmetic only. Nonnegative values do not establish an information model. */
export function phaseDefect(n:number,p:number,s:number,policy:LogarithmPolicy,
  interpretation:PhaseDefectInterpretation='phase-defect'){
  domain(n,p,policy);shift(p,s);
  if(interpretation!=='phase-defect')refuse('information interpretation unsupported');
  return {model:'F4-integer-phase-defect@1' as const,parameters:{n,p,s},policy,
    status:'measured' as const,meaning:'phase defect; information interpretation open' as const,
    regime:n/p>=2?'nonnegative' as const:'may-be-negative' as const,
    value:Math.log2(n/p)-binaryEntropy(s/p)};
}
/** Closed-form extrema in the declared integer domain; finite enumeration is separate evidence. */
export function phaseDefectExtrema(n:number,p:number,policy:LogarithmPolicy){
  domain(n,p,policy);
  const middle=Math.floor(p/2),minimumShifts=p===1?[0]:p%2===0?[middle]:[middle,middle+1];
  return {model:'F4-integer-phase-defect@1' as const,parameters:{n,p},policy,
    status:'measured' as const,
    minimum:{value:Math.log2(n/p)-binaryEntropy(middle/p),shifts:minimumShifts},
    maximum:{value:Math.log2(n/p),shifts:[0]},
    nonzeroMaximum:p===1?null:{value:Math.log2(n/p)-binaryEntropy(1/p),shifts:p===2?[1]:[1,p-1]}};
}
