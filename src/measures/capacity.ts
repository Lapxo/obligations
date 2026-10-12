import {add,sub,mul,div,q,pow,zero,one,pack,probability,type Q,type RationalInput} from './rational.ts';

export type CapacityModel=Readonly<{n:number;c:RationalInput;p:RationalInput}>;
export type LogarithmPolicy=Readonly<{logarithm:'binary64-log2'}>;
export type CapacityPolicy=LogarithmPolicy & Readonly<{budget:string}>;
export type DecisionRule='plurality-uniform-ties@1'|'posterior-map-uniform-ties@1';
const refuse=(cause:string):never=>{throw new Error('REFUSE·capacity '+cause);};
function cardinality(n:number){if(!Number.isSafeInteger(n)||n<2)refuse('invalid cardinality');}
function logPolicy(policy:LogarithmPolicy){if(!policy||policy.logarithm!=='binary64-log2')refuse('logarithm policy required');}
// Convert only the leading 53 bits: exact probabilities stay rational; logs are explicitly binary64 approximations.
function logInteger(value:bigint):number {
  const bits=value.toString(2).length,shift=Math.max(0,bits-53);
  return Math.log2(Number(value>>BigInt(shift)))+shift;
}
function logQ(value:Q):number {return logInteger(value[0])-logInteger(value[1]);}
function numeric(value:Q):number {return value[0]===0n?0:2**logQ(value);}
function entropy(probabilities:readonly Q[]):number {
  let value=0,correction=0;
  for(const p of probabilities){
    if(p[0]===0n)continue;
    const term=-numeric(p)*logQ(p)-correction,next=value+term;
    correction=(next-value)-term;value=next;
  }
  return value;
}
export function capacityBound(n:number,c:RationalInput,policy:LogarithmPolicy){
  cardinality(n);logPolicy(policy);const factor=probability(c);
  return {model:'single-dominant-factor@1' as const,parameters:{n,c:pack(factor)},policy,
    status:'measured' as const,unit:'bits' as const,value:Math.log2(n)-numeric(factor)*Math.log2(n-1),
    meaning:'upper bound for every k; achievability depends on the private channel' as const};
}
export function capacityP0(n:number,c:RationalInput,policy:LogarithmPolicy){
  const bound=capacityBound(n,c,policy),factor=probability(c);
  return {...bound,value:bound.value-entropy([factor,sub(one,factor)]),meaning:'mutual information at p=0 for every positive k' as const};
}
export function unanimityNoFactor(k:number,n:number,p:RationalInput,policy:Readonly<{budget:string}>){
  cardinality(n);if(!Number.isSafeInteger(k)||k<1)refuse('invalid witness count');
  if(!policy||typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))refuse('power budget required');
  const error=probability(p);
  const required=BigInt(k)*(BigInt(error[1].toString(2).length)+BigInt(BigInt(n-1).toString(2).length)+2n);
  if(required>BigInt(policy.budget))return {status:'unmeasured' as const,cause:'capacity/power-budget',required:String(required),workUnit:'rational-bit-bound' as const};
  return {status:'measured' as const,model:'single-dominant-factor@1' as const,parameters:{k,n,p:pack(error)},
    policy,workUnit:'rational-bit-bound' as const,value:pack(add(pow(sub(one,error),k),div(pow(error,k),pow(q(BigInt(n-1)),k-1))))};
}
type EntropyTerm={mass:Q;posterior:Q};
function term(terms:Map<string,EntropyTerm>,mass:Q,posterior:Q){
  if(mass[0]===0n)return;
  const key=posterior.join('/'),previous=terms.get(key);
  terms.set(key,{mass:previous?add(previous.mass,mass):mass,posterior});
}
function evaluateEntropy(terms:Map<string,EntropyTerm>):number {
  let sum=0,correction=0;
  for(const item of terms.values()){
    const contribution=-numeric(item.mass)*logQ(item.posterior)-correction,next=sum+contribution;
    correction=(next-sum)-contribution;sum=next;
  }
  return sum;
}
function prepared(k:number,model:CapacityModel,policy:CapacityPolicy){
  if(!model)refuse('model required');cardinality(model.n);logPolicy(policy);
  if(!Number.isSafeInteger(k)||k<1)refuse('invalid witness count');
  if(typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))refuse('invalid enumeration budget');
  const c=probability(model.c),p=probability(model.p),cap=BigInt(policy.budget);
  let work=1n;
  for(let i=0;i<=k;i++){work*=BigInt(model.n);if(work>cap)break;}
  return {c,p,cap,work};
}

/** Exact joint probabilities; explicitly approximate logarithms. No algebra, inference of structure or I/O. */
export function mutualInformation(k:number,model:CapacityModel,policy:CapacityPolicy){
  return evaluateCapacity(k,model,policy);
}
/** Reports decision accuracy and decision information separately from posterior information. */
export function decisionInformation(k:number,model:CapacityModel,rule:DecisionRule,policy:CapacityPolicy){
  if(rule!=='plurality-uniform-ties@1'&&rule!=='posterior-map-uniform-ties@1')refuse('unknown decision rule');
  return evaluateCapacity(k,model,policy,rule);
}
function evaluateCapacity(k:number,model:CapacityModel,policy:CapacityPolicy,rule?:DecisionRule){
  const {c,p,cap,work}=prepared(k,model,policy),n=model.n;
  const metadata={model:'single-dominant-factor@1' as const,parameters:{k,n,c:pack(c),p:pack(p)},policy,
    conditions:['uniform-truth','factor-independent-of-truth','uniform-shared-wrong-value',
      'independent-homogeneous-private-channel'] as const};
  if(work>cap)return {...metadata,status:'unmeasured' as const,cause:'capacity/budget',requiredAtLeast:String(work)};
  const terms=new Map<string,EntropyTerm>(),privateTerms=new Map<string,EntropyTerm>();
  const decisions=rule?Array.from({length:n},()=>Array.from({length:n},()=>zero)):undefined;
  let total:Q=zero,accuracy:Q=zero;
  const counts=Array(n).fill(0) as number[];
  function visit(depth:number){
    if(depth<k){for(let value=0;value<n;value++){counts[value]++;visit(depth+1);counts[value]--;}return;}
    const unanimous=counts.findIndex(count=>count===k),privateMass:Q[]=[],joint:Q[]=[];
    for(let t=0;t<n;t++){
      const channel=mul(pow(sub(one,p),counts[t]!),pow(div(p,q(BigInt(n-1))),k-counts[t]!));
      const independent=div(channel,q(BigInt(n)));
      privateMass.push(independent);
      const forced=unanimous>=0&&unanimous!==t?div(c,q(BigInt(n)*BigInt(n-1))):zero;
      joint.push(add(mul(sub(one,c),independent),forced));
    }
    const mass=joint.reduce(add,zero),privateTotal=privateMass.reduce(add,zero);
    total=add(total,mass);
    joint.forEach(value=>{if(value[0]!==0n)term(terms,value,div(value,mass));});
    privateMass.forEach(value=>{if(value[0]!==0n)term(privateTerms,value,div(value,privateTotal));});
    if(!decisions||mass[0]===0n)return;
    const winners:number[]=[];
    if(rule==='plurality-uniform-ties@1'){
      const largest=Math.max(...counts);counts.forEach((count,i)=>{if(count===largest)winners.push(i);});
    }else{
      let largest:Q=zero;
      for(const value of joint)if(value[0]*largest[1]>largest[0]*value[1])largest=value;
      joint.forEach((value,i)=>{if(value[0]*largest[1]===largest[0]*value[1])winners.push(i);});
    }
    for(let t=0;t<n;t++)for(const answer of winners){
      const mass=div(joint[t]!,q(BigInt(winners.length)));
      decisions[t]![answer]=add(decisions[t]![answer]!,mass);
      if(answer===t)accuracy=add(accuracy,mass);
    }
  }
  visit(0);
  const conditional=evaluateEntropy(terms),privateConditional=evaluateEntropy(privateTerms);
  const result={...metadata,status:'measured' as const,unit:'bits' as const,
    value:Math.log2(n)-conditional,probabilitySum:pack(total),work:String(work),
    loss:{exclusion:numeric(c)*Math.log2(n-1),privateUncertainty:numeric(sub(one,c))*privateConditional,
      factorAmbiguity:conditional-numeric(c)*Math.log2(n-1)-numeric(sub(one,c))*privateConditional},
    exactConditionalEntropy:[...terms.values()].map(({mass,posterior})=>({mass:pack(mass),posterior:pack(posterior)}))};
  if(!decisions)return result;
  const decisionTerms=new Map<string,EntropyTerm>();
  for(let answer=0;answer<n;answer++){
    const mass=decisions.reduce((sum,row)=>add(sum,row[answer]!),zero);
    if(mass[0]===0n)continue;
    for(const row of decisions)if(row[answer]![0]!==0n)term(decisionTerms,row[answer]!,div(row[answer]!,mass));
  }
  return {...result,decision:{rule,accuracy:pack(accuracy),information:Math.log2(n)-evaluateEntropy(decisionTerms),
    joint:decisions.map(row=>row.map(pack)),tiePolicy:'uniform-over-maximizers' as const}};
}
