import type {Covariance,Scalar,Unmeasured} from './error-events.ts';
export type NumericalPolicy=Readonly<{absolute:number; relative:number; maxRotations:number}>;
export type Spectrum=Readonly<{status:'measured'; origins:readonly string[]; values:readonly number[]; vectors:readonly (readonly number[])[]; tolerance:number; residual:number}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·measure '+cause);};

/** Symmetric Jacobi decomposition; vectors describe variation, not latent causes. */
export function spectrum(reading:Covariance|Unmeasured,policy:NumericalPolicy):Spectrum|Unmeasured {
  if(reading.status==='unmeasured')return reading;
  if(!Number.isFinite(policy.absolute)||policy.absolute<=0||!Number.isFinite(policy.relative)||policy.relative<0||!Number.isSafeInteger(policy.maxRotations)||policy.maxRotations<1)refuse('invalid numerical policy');
  const n=reading.origins.length,original=reading.matrix;
  if(!n||original.length!==n||original.some(row=>row.length!==n||row.some(x=>!Number.isFinite(x))))refuse('invalid covariance matrix');
  const scale=Math.max(...original.flat().map(Math.abs)),tolerance=policy.absolute+policy.relative*scale;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(original[i]![j]!==original[j]![i])refuse('nonsymmetric covariance');
  const a=original.map(row=>[...row]),v=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j):number=>i===j?1:0));
  for(let step=0;step<policy.maxRotations;step++){
    let p=0,q=0,largest=0;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i]![j]!)>largest){largest=Math.abs(a[i]![j]!);p=i;q=j;}
    if(largest<=tolerance)break;
    const theta=.5*Math.atan2(2*a[p]![q]!,a[q]![q]!-a[p]![p]!),c=Math.cos(theta),s=Math.sin(theta);
    const pp=a[p]![p]!,qq=a[q]![q]!,pq=a[p]![q]!;
    for(let k=0;k<n;k++)if(k!==p&&k!==q){const x=a[k]![p]!,y=a[k]![q]!;a[k]![p]=a[p]![k]=c*x-s*y;a[k]![q]=a[q]![k]=s*x+c*y;}
    a[p]![p]=c*c*pp-2*s*c*pq+s*s*qq;a[q]![q]=s*s*pp+2*s*c*pq+c*c*qq;a[p]![q]=a[q]![p]=0;
    for(let k=0;k<n;k++){const x=v[k]![p]!,y=v[k]![q]!;v[k]![p]=c*x-s*y;v[k]![q]=s*x+c*y;}
  }
  const order=Array.from({length:n},(_,i)=>i).sort((i,j)=>a[j]![j]!-a[i]![i]!||i-j);
  const raw=order.map(i=>a[i]![i]!);
  if(raw.some(x=>x < -tolerance))refuse('covariance is not positive semidefinite');
  const values=raw.map(x=>Math.max(0,x)),vectors=order.map(i=>v.map(row=>row[i]!));
  const residual=Math.max(...vectors.map((vector,i)=>Math.hypot(...original.map((row,j)=>row.reduce((sum,x,k)=>sum+x*vector[k]!,0)-values[i]!*vector[j]!))));
  if(residual>n*tolerance)return {status:'unmeasured',cause:'eigensolver did not converge within declared budget'};
  return {status:'measured',origins:reading.origins,values,vectors,tolerance,residual};
}
export function commonMass(reading:Spectrum|Unmeasured):Scalar {
  if(reading.status==='unmeasured')return reading;
  const total=reading.values.reduce((sum,x)=>sum+x,0);
  return total<=reading.tolerance?{status:'unmeasured',cause:'no resolved variation'}:{status:'measured',value:reading.values[0]!/total};
}
/** Top eigenvector is individually meaningful only if its eigenvalue is isolated. */
export function loadings(reading:Spectrum|Unmeasured):Readonly<{status:'measured'; origins:readonly string[]; values:readonly number[]}>|Unmeasured {
  if(reading.status==='unmeasured')return reading;
  if(reading.values[0]!<=reading.tolerance||(reading.values.length>1&&reading.values[0]!-reading.values[1]!<=2*reading.tolerance))return {status:'unmeasured',cause:'top eigenspace is unresolved or repeated'};
  return {status:'measured',origins:reading.origins,values:reading.vectors[0]!.map(Math.abs)};
}
/** Fraction of marginal variance in S represented by selected whole eigenspaces. */
export function commonMassOf(reading:Spectrum|Unmeasured,origins:readonly string[],tau:number):Scalar {
  if(reading.status==='unmeasured')return reading;
  if(!Number.isFinite(tau)||tau<=0||tau>1)refuse('invalid spectral threshold');
  const selected=[...new Set(origins)].map(origin=>reading.origins.indexOf(origin));
  if(!selected.length||selected.some(i=>i<0))return {status:'unmeasured',cause:'subset not observed'};
  const energy=reading.values.map((value,k)=>value*selected.reduce((sum,i)=>sum+reading.vectors[k]![i]!**2,0));
  const total=energy.reduce((sum,x)=>sum+x,0);
  if(total<=reading.tolerance)return {status:'unmeasured',cause:'no resolved subset variation'};
  const cutoff=tau*reading.values[0]!;
  if(reading.values.some(value=>Math.abs(value-cutoff)<=2*reading.tolerance)&&tau!==1)return {status:'unmeasured',cause:'spectral threshold unresolved at tolerance'};
  const common=energy.reduce((sum,x,k)=>sum+(reading.values[k]!>=cutoff-2*reading.tolerance?x:0),0);
  return {status:'measured',value:common/total};
}
