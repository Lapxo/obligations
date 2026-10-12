import {errorMatrix,type ErrorEvent,type ObservationPolicy} from './error-events.ts';
import {refuse} from './rational.ts';
export type FitStructure=Readonly<{factors:readonly Readonly<{id:string;members:readonly string[]}>[]}>;
export type FitPolicy=Readonly<{observation:ObservationPolicy;activeSets:string;solveTolerance:number;residualTolerance:number;bootstrap:Readonly<{B:number;seed:number;prng:'xorshift32';randomWords:number}>}>;
function solve(matrix:readonly (readonly number[])[],values:readonly number[],tolerance:number):number[]|undefined {
 const a=matrix.map((row,i)=>[...row,values[i]!]),n=a.length;
 for(let j=0;j<n;j++){
  let pivot=j;for(let i=j+1;i<n;i++)if(Math.abs(a[i]![j]!)>Math.abs(a[pivot]![j]!))pivot=i;
  if(Math.abs(a[pivot]![j]!)<=tolerance)return undefined;
  [a[j],a[pivot]]=[a[pivot]!,a[j]!];const d=a[j]![j]!;a[j]=a[j]!.map(v=>v/d);
  for(let i=0;i<n;i++)if(i!==j){const p=a[i]![j]!;a[i]=a[i]!.map((v,k)=>v-p*a[j]![k]!);}
 }
 return a.map(row=>row[n]!);
}
function *subsets(total:number,max:number,start=0,prefix:readonly number[]=[]):Generator<readonly number[]>{
 yield prefix;if(prefix.length===max)return;for(let i=start;i<total;i++)yield*subsets(total,max,i+1,[...prefix,i]);
}
/** Declared finite-data procedure, distinct from population identification and handed Φ/D. */
export function fitM3(rows:readonly ErrorEvent[],structure:FitStructure,policy:FitPolicy){
 if(!policy||!/^\d+$/.test(policy.activeSets)||!Number.isFinite(policy.solveTolerance)||policy.solveTolerance<=0||!Number.isFinite(policy.residualTolerance)||policy.residualTolerance<0||!policy.bootstrap||policy.bootstrap.prng!=='xorshift32'||!Number.isInteger(policy.bootstrap.seed)||policy.bootstrap.seed<1||policy.bootstrap.seed>0xffffffff||!Number.isSafeInteger(policy.bootstrap.B)||policy.bootstrap.B<0||!Number.isSafeInteger(policy.bootstrap.randomWords)||policy.bootstrap.randomWords<0)refuse('invalid fitting policy');
 const reading=errorMatrix(rows,policy.observation),metadata={model:'M/3' as const,parameters:{rows,structure},policy,conditions:['one-declared-parameter-population','declared-sharing-sets','finite-data','no-pseudocounts','fitted-not-handed'] as const,procedure:'constrained-log-least-squares/active-set@1' as const};
 if(reading.status==='unmeasured')return {...metadata,...reading};
 if(!structure||!Array.isArray(structure.factors)||structure.factors.some(f=>!f)||new Set(structure.factors.map(f=>f.id)).size!==structure.factors.length||structure.factors.some(f=>!f.id||!Array.isArray(f.members)||new Set(f.members).size!==f.members.length||f.members.some((id:string)=>!reading.origins.includes(id))))refuse('invalid fitting sharing structure');
 const shared=structure.factors.filter(f=>f.members.length>1),n=shared.length,w=reading.origins.length;
 const pairs:readonly [number,number][]=[...reading.origins.flatMap((_,i)=>reading.origins.flatMap((__,j)=>j>i?[[i,j] as [number,number]]:[]))];
 const A:number[][]=pairs.map(([i,j])=>shared.map(f=>f.members.includes(reading.origins[i]!)&&f.members.includes(reading.origins[j]!)?1:0));
 const H=shared.map((_,i)=>shared.map((__,j)=>A.reduce((sum,row)=>sum+row[i]!*row[j]!,0)));
 if(n&&!solve(H,Array(n).fill(0),policy.solveTolerance))return {...metadata,status:'unmeasured' as const,cause:'rank-deficient declared sharing system'};
 let combinations=1n,term=1n;for(let k=1;k<=n;k++){term=term*BigInt(n+w-k+1)/BigInt(k);combinations+=term;}
 const required=combinations*BigInt(policy.bootstrap.B+1);
 if(required>BigInt(policy.activeSets))return {...metadata,status:'unmeasured' as const,cause:'fitting/active-sets',required:String(required)};
 const once=(data:readonly (readonly number[])[])=>{
  const s=reading.origins.map((_,i)=>data.reduce((sum,row)=>sum+(1-row[i]!),0)/data.length);
  if(s.some(v=>v===0))return {status:'unmeasured' as const,cause:'model/M misfit: zero correct count'};
  const joints=pairs.map(([i,j])=>data.reduce((sum,row)=>sum+(1-row[i]!)*(1-row[j]!),0)/data.length);
  if(joints.some(v=>v===0))return {status:'unmeasured' as const,cause:'model/M misfit: zero joint-correct count'};
  const y=joints.map((v,k)=>Math.log(v/(s[pairs[k]![0]]!*s[pairs[k]![1]]!))),g=shared.map((_,j)=>A.reduce((sum,row,i)=>sum+row[j]!*y[i]!,0));
  const C:number[][]=[...shared.map((_,i)=>shared.map((__,j)=>i===j?-1:0)),...reading.origins.map(id=>shared.map(f=>f.members.includes(id)?1:0))],d=[...shared.map(()=>0),...s.map(v=>-Math.log(v))];
  let best:number[]|undefined,bestCost=Infinity;
  for(const active of subsets(n+w,n)){
   const size=n+active.length,K=Array.from({length:size},()=>Array(size).fill(0));
   for(let i=0;i<n;i++)for(let j=0;j<n;j++)K[i]![j]=H[i]![j]!;
   active.forEach((constraint,k)=>C[constraint]!.forEach((v,j)=>{K[n+k]![j]=v;K[j]![n+k]=v;}));
   const candidate=solve(K,[...g,...active.map(i=>d[i]!)],policy.solveTolerance);if(!candidate)continue;
   const alpha=candidate.slice(0,n),lambda=candidate.slice(n);
   // Numerical tolerances judge a solve; no observation or probability is clamped.
   if(alpha.some(v=>v<0)||lambda.some(v=>v< -policy.solveTolerance)||C.some((row,i)=>row.reduce((sum,v,j)=>sum+v*alpha[j]!,0)>d[i]!+policy.solveTolerance))continue;
   const cost=A.reduce((sum,row,i)=>sum+(row.reduce((s,v,j)=>s+v*alpha[j]!,0)-y[i]!)**2,0);
   if(cost<bestCost){best=alpha;bestCost=cost;}
  }
  if(!best)return {status:'unmeasured' as const,cause:'model/M misfit: no feasible numerical solution'};
  const residuals=A.map((row,i)=>row.reduce((sum,v,j)=>sum+v*best![j]!,0)-y[i]!);
  if(residuals.some(v=>Math.abs(v)>policy.residualTolerance))return {status:'unmeasured' as const,cause:'model/M misfit: residual tolerance',residuals};
  return {status:'fitted' as const,factors:shared.map((f,i)=>({id:f.id,probability:1-Math.exp(-best![i]!)})),residuals,residualSumSquares:bestCost,residualSurvival:reading.origins.map((id,i)=>({id,r:s[i]!*Math.exp(shared.reduce((sum,f,j)=>sum+(f.members.includes(id)?best![j]!:0),0)),privateSingletonDecomposition:'unresolved' as const}))};
 };
 const fit=once(reading.matrix);if(fit.status!=='fitted')return {...metadata,...fit};
 let x=policy.bootstrap.seed>>>0,words=0;const exhausted=Symbol('bootstrap/random-words');
 const index=()=>{const N=reading.matrix.length,limit=Math.floor(4294967296/N)*N;for(;;){if(words===policy.bootstrap.randomWords)throw exhausted;words++;x^=x<<13;x^=x>>>17;x^=x<<5;const r=x>>>0;if(r<limit)return r%N;}};
 const replicates:ReturnType<typeof once>[]=[];
 try{for(let b=0;b<policy.bootstrap.B;b++)replicates.push(once(reading.matrix.map(()=>reading.matrix[index()]!)));}
 catch(error){if(error!==exhausted)throw error;return {...metadata,...fit,bootstrap:{status:'unmeasured' as const,cause:'bootstrap/random-words',words}};}
 const complete=policy.bootstrap.B>0&&replicates.every(r=>r.status==='fitted');
 return {...metadata,...fit,bootstrap:{status:complete?'measured' as const:'unmeasured' as const,cause:complete?undefined:policy.bootstrap.B?'model/M misfit in bootstrap replicates':'no bootstrap replicates requested',words,replicates},quantities:'Φ and D require handed parameters; never reported from this fit' as const};
}
