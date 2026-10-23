import {add,sub,mul,div,one,zero,equal,pack,probability,type Q,type RationalInput} from './rational.ts';
import {reduceExact} from './exact-reduction.ts';
export type SimilarityModel=Readonly<{model:'normalized-symmetric-similarity@1';sources:readonly string[];matrix:readonly (readonly RationalInput[])[]}>;
export type DiversityPolicy=Readonly<{budget:string}>;
const fail=(cause:string):never=>{throw Error('REFUSE·diversity/'+cause)};
/** Global q=2 maximum over the simplex, using every nonsingular positive weighting.
 * No covariance conversion, PSD assumption, approximate inverse or causal interpretation. */
export function maximumDiversity(model:SimilarityModel,policy:DiversityPolicy){
 if(!model||model.model!=='normalized-symmetric-similarity@1'||!Array.isArray(model.matrix))return {status:'unmeasured' as const,cause:'diversity/similarity-required'};
 if(!Array.isArray(model.sources)||!model.sources.length||model.sources.some(s=>typeof s!=='string'||!s)||new Set(model.sources).size!==model.sources.length)fail('source-identity');
 if(!policy||typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))fail('budget-required');
 const n=model.sources.length;if(model.matrix.length!==n||model.matrix.some(row=>!Array.isArray(row)||row.length!==n))fail('matrix-domain');
 const Z:Q[][]=model.matrix.map((row:readonly RationalInput[])=>row.map((x:RationalInput)=>probability(x)));
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  if(i===j&&!equal(Z[i]![j]!,one))fail('unit-diagonal-required');
  if(!equal(Z[i]![j]!,Z[j]![i]!))fail('symmetric-similarity-required');
 }
 const cap=BigInt(policy.budget),perSupport=BigInt(n)*BigInt(n)*BigInt(2*n+1);let count=0n;
 for(let i=0;i<n;i++){count=2n*count+1n;if(count*perSupport>cap)return {status:'unmeasured' as const,cause:'diversity/budget',requiredAtLeast:String(count*perSupport),workUnit:'rational-update-bound' as const};}
 let best=zero,bestWeights:Q[]=[],support:number[]=[];let singular=0n,nonpositive=0n,eligible=0n,maximizers=0n;
 for(let mask=1n;mask<=count;mask++){
  const ids=Array.from({length:n},(_,i)=>i).filter(i=>(mask>>BigInt(i)&1n)!==0n),a=ids.map(i=>ids.map(j=>Z[i]![j]!));
  const reduced=reduceExact(a,ids.length);if(reduced.rank!==ids.length){singular++;continue;}
  const w=reduced.transform.map(row=>row.reduce(add,zero));if(w.some(x=>x[0]<=0n)){nonpositive++;continue;}
  eligible++;const magnitude=w.reduce(add,zero),difference=sub(magnitude,best)[0];
  if(difference>0n){best=magnitude;bestWeights=w;support=ids;maximizers=1n}else if(difference===0n)maximizers++;
 }
 if(best[0]<=0n)fail('certificate-missing');
 const weights=model.sources.map((source,i)=>({source,p:pack(support.includes(i)?div(bestWeights[support.indexOf(i)]!,best):zero)}));
 // Verify the returned simplex representative against the declared matrix exactly.
 const p=weights.map(w=>div([BigInt(w.p.numerator),BigInt(w.p.denominator)],one));
 const quadratic=p.reduce((sum,pi,i)=>add(sum,mul(pi,Z[i]!.reduce((v,z,j)=>add(v,mul(z,p[j]!)),zero))),zero);
 if(!equal(quadratic,div(one,best))||sub(best,[BigInt(n),1n])[0]>0n)fail('certificate-differs');
 return {status:'measured' as const,model:model.model,parameters:model,policy,unit:'similarity-diversity' as const,order:2 as const,value:pack(best),weights,
  certificate:{method:'exhaustive-positive-support-weightings' as const,checked:String(count),singular:String(singular),nonpositive:String(nonpositive),eligible:String(eligible),enumeratedMaximizers:String(maximizers),quadratic:pack(quadratic),workUnit:'rational-update-bound' as const,required:String(count*perSupport)},
  tiePolicy:'first-nonsingular-support-in-declared-source-order' as const,
  meaning:'global maximum for the supplied normalized symmetric similarity; weights are an optimizer representative, not error-optimal voting, independent causes or authority' as const};
}
