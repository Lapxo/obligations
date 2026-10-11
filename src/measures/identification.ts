import {add,sub,mul,div,q,zero,one,equal,pack,probability,refuse,type Q,type RationalInput} from './rational.ts';
export type IdentificationInput=Readonly<{
 witnesses:readonly Readonly<{id:string;correct:RationalInput}>[];
 factors:readonly Readonly<{id:string;members:readonly string[]}>[];
 pairs:readonly Readonly<{a:string;b:string;correctTogether:RationalInput}>[];
}>;
export type IdentificationPolicy=Readonly<{budget:string}>;
const key=(a:string,b:string)=>JSON.stringify([a,b].sort());
const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;
const integerPower=(a:Q,n:bigint):Q=>n<0n?q(a[1]**(-n),a[0]**(-n)):q(a[0]**n,a[1]**n);
function exactRoot(a:bigint,n:bigint):bigint|undefined {
 if(a===0n||a===1n||n===1n)return a;
 if(n>BigInt(a.toString(2).length))return undefined;
 let low=1n,high=a;
 while(low<=high){const middle=(low+high)/2n,p=middle**n;if(p===a)return middle;if(p<a)low=middle+1n;else high=middle-1n;}
 return undefined;
}
function monomial(bases:readonly Q[],powers:readonly Q[]){
 let degree=1n;for(const p of powers)degree=degree/gcd(degree,p[1])*p[1];
 let radicand=one;for(let i=0;i<bases.length;i++)radicand=mul(radicand,integerPower(bases[i]!,powers[i]![0]*(degree/powers[i]![1])));
 const a=exactRoot(radicand[0],degree),b=exactRoot(radicand[1],degree);
 return {radicand:pack(radicand),degree:String(degree),rational:a===undefined||b===undefined?undefined:pack(q(a,b))};
}
/** Population moments and declared structure only; singleton/private causes remain unresolved. */
export function identifyM3(input:IdentificationInput,policy:IdentificationPolicy){
 if(!input||!Array.isArray(input.witnesses)||!Array.isArray(input.factors)||!Array.isArray(input.pairs)||!policy||!/^\d+$/.test(policy.budget))refuse('invalid identification inputs');
 const ids=input.witnesses.map(w=>w?.id);
 if(!ids.length||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)refuse('invalid identification witnesses');
 if(input.factors.some(f=>!f||typeof f.id!=='string'||!f.id||!Array.isArray(f.members)||new Set(f.members).size!==f.members.length||f.members.some(id=>!ids.includes(id)))||new Set(input.factors.map(f=>f.id)).size!==input.factors.length)refuse('invalid declared sharing structure');
 const s=input.witnesses.map(w=>probability(w.correct));
 const shared=input.factors.filter(f=>f.members.length>1),rows=input.pairs.length,columns=shared.length;
 const metadata={model:'M/3' as const,parameters:input,conditions:['population-moments','declared-sharing-sets','positive-correctness','full-column-rank','singleton-private-unresolved'] as const,policy};
 if(s.some(p=>p[0]===0n))return {...metadata,status:'unmeasured' as const,cause:'zero correctness; unidentified'};
 const seen=new Set<string>(),bases:Q[]=[],matrix:Q[][]=[];
 for(const pair of input.pairs){
  if(!pair||pair.a===pair.b||!ids.includes(pair.a)||!ids.includes(pair.b)||seen.has(key(pair.a,pair.b)))refuse('invalid identification pair');
  seen.add(key(pair.a,pair.b));const a=s[ids.indexOf(pair.a)]!,b=s[ids.indexOf(pair.b)]!,joint=probability(pair.correctTogether);
  if(joint[0]===0n||sub(joint,a)[0]>0n||sub(joint,b)[0]>0n||sub(joint,sub(add(a,b),one))[0]<0n)return {...metadata,status:'unmeasured' as const,cause:'model/M misfit'};
  bases.push(div(joint,mul(a,b)));matrix.push(shared.map(f=>f.members.includes(pair.a)&&f.members.includes(pair.b)?one:zero));
 }
 // An explicit upper bound on elimination updates is checked before elimination.
 const work=BigInt(rows)*BigInt(columns)*BigInt(rows+columns+1);
 if(work>BigInt(policy.budget))return {...metadata,status:'unmeasured' as const,cause:'identification/budget',required:String(work)};
 const transform=matrix.map((_,i)=>matrix.map((__,j)=>i===j?one:zero));
 let rank=0;const pivots:number[]=[];
 for(let column=0;column<columns;column++){
  const pivot=matrix.findIndex((row,i)=>i>=rank&&row[column]![0]!==0n);if(pivot<0)continue;
  [matrix[rank],matrix[pivot]]=[matrix[pivot]!,matrix[rank]!];[transform[rank],transform[pivot]]=[transform[pivot]!,transform[rank]!];
  const divisor=matrix[rank]![column]!;matrix[rank]=matrix[rank]!.map(v=>div(v,divisor));transform[rank]=transform[rank]!.map(v=>div(v,divisor));
  for(let i=0;i<rows;i++)if(i!==rank){const amount=matrix[i]![column]!;matrix[i]=matrix[i]!.map((v,j)=>sub(v,mul(amount,matrix[rank]![j]!)));transform[i]=transform[i]!.map((v,j)=>sub(v,mul(amount,transform[rank]![j]!)));}
  pivots.push(column);rank++;
 }
 if(rank!==columns)return {...metadata,status:'unmeasured' as const,cause:'rank-deficient declared sharing system',rank,columns};
 for(let i=rank;i<rows;i++){const residual=monomial(bases,transform[i]!);if(!equal(q(BigInt(residual.radicand.numerator),BigInt(residual.radicand.denominator)),one))return {...metadata,status:'unmeasured' as const,cause:'model/M misfit',rank,columns};}
 const factors=shared.map((factor,j)=>{
  const powers=transform[pivots.indexOf(j)]!,inverseSurvival=monomial(bases,powers);
  const radicand=q(BigInt(inverseSurvival.radicand.numerator),BigInt(inverseSurvival.radicand.denominator));
  if(sub(radicand,one)[0]<0n)return {id:factor.id,misfit:true as const};
  const survival=monomial(bases,powers.map(p=>q(-p[0],p[1])));
  return {id:factor.id,survival,probability:survival.rational?pack(sub(one,q(BigInt(survival.rational.numerator),BigInt(survival.rational.denominator)))):undefined};
 });
 if(factors.some(f=>'misfit' in f))return {...metadata,status:'unmeasured' as const,cause:'model/M misfit',rank,columns};
 const residualSurvival=input.witnesses.map((w,i)=>{
  const powers=bases.map(()=>zero);shared.forEach((f,j)=>{if(f.members.includes(w.id))transform[pivots.indexOf(j)]!.forEach((p,k)=>{powers[k]=add(powers[k]!,p);});});
  const r=monomial([s[i]!,...bases],[one,...powers]);
  return {witness:w.id,r,privateSingletonDecomposition:'unresolved' as const};
 });
 if(residualSurvival.some(w=>sub(q(BigInt(w.r.radicand.numerator),BigInt(w.r.radicand.denominator)),one)[0]>0n))return {...metadata,status:'unmeasured' as const,cause:'model/M misfit',rank,columns};
 return {...metadata,status:'identified' as const,rank,columns,factors,residualSurvival,representation:'positive exact rational roots' as const};
}
