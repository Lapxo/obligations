import {add,sub,mul,div,q,pow,zero,one,pack,probability,type Q,type RationalInput} from './rational.ts';

export type UnanimityCount=Readonly<{k:number;unanimous:number;trials:number}>;
export type UnanimityGroup=Readonly<{id:string;outcomes:readonly Readonly<{k:number;unanimous:boolean}>[]}>;
export type UnanimityCurve=Readonly<{n:number;lineage:string;counts:readonly UnanimityCount[];groups?:readonly UnanimityGroup[]}>;
export type UnanimityFitPolicy=Readonly<{procedure:'exact-c-slices-on-declared-p-grid@1';p:readonly RationalInput[];
  tolerance:RationalInput;budget:string;bootstrap:Readonly<{B:number;seed:number;prng:'xorshift32';randomWords:number}>}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·unanimity-fit '+cause);};
const compare=(a:Q,b:Q)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
function privateRate(k:number,n:number,p:Q):Q {
  return add(pow(sub(one,p),k),div(pow(p,k),pow(q(BigInt(n-1)),k-1)));
}
function slices(counts:readonly UnanimityCount[],n:number,grid:readonly Q[],tolerance:Q){
  return grid.flatMap(p=>{
    let lo:Q=zero,hi:Q=one;
    for(const row of counts){
      const observed=q(BigInt(row.unanimous),BigInt(row.trials)),a=privateRate(row.k,n,p),b=sub(one,a);
      if(b[0]===0n){if(compare(observed,sub(one,tolerance))<0)return [];continue;}
      const lower=div(sub(sub(observed,tolerance),a),b),upper=div(sub(add(observed,tolerance),a),b);
      if(compare(lower,lo)>0)lo=lower;if(compare(upper,hi)<0)hi=upper;
      if(compare(lo,hi)>0)return [];
    }
    const midpoint=div(add(lo,hi),q(2n));
    return [{p:pack(p),c:{lo:pack(lo),hi:pack(hi)},residuals:counts.map(row=>{
      const predicted=add(midpoint,mul(sub(one,midpoint),privateRate(row.k,n,p)));
      return {k:row.k,at:'slice-midpoint' as const,predicted:pack(predicted),
        observed:pack(q(BigInt(row.unanimous),BigInt(row.trials))),
        residual:pack(sub(q(BigInt(row.unanimous),BigInt(row.trials)),predicted))};
    })}];
  });
}

/** Exact compatible c intervals at declared p values. A finite grid makes no assertion about points between slices. */
export function fitUnanimityModel(curve:UnanimityCurve,policy:UnanimityFitPolicy){
  if(!curve||!Number.isSafeInteger(curve.n)||curve.n<2||typeof curve.lineage!=='string'||!curve.lineage||
    !Array.isArray(curve.counts)||!curve.counts.length)refuse('one declared lineage, cardinality and counts required');
  if(curve.counts.some(row=>!row||!Number.isSafeInteger(row.k)||row.k<1||!Number.isSafeInteger(row.trials)||row.trials<1||
    !Number.isSafeInteger(row.unanimous)||row.unanimous<0||row.unanimous>row.trials))refuse('invalid size counts');
  const counts=[...curve.counts].sort((a,b)=>a.k-b.k);
  if(new Set(counts.map(row=>row.k)).size!==counts.length)
    refuse('invalid or duplicate size counts');
  if(!policy||policy.procedure!=='exact-c-slices-on-declared-p-grid@1'||!Array.isArray(policy.p)||!policy.p.length||
    typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))refuse('declared fitting procedure and budget required');
  const grid=policy.p.map(probability).sort(compare),tolerance=probability(policy.tolerance),bootstrap=policy.bootstrap;
  if(new Set(grid.map(p=>p.join('/'))).size!==grid.length)refuse('duplicate p slice');
  if(!bootstrap||bootstrap.prng!=='xorshift32'||!Number.isInteger(bootstrap.seed)||bootstrap.seed<1||bootstrap.seed>0xffffffff||
    !Number.isSafeInteger(bootstrap.B)||bootstrap.B<0||!Number.isSafeInteger(bootstrap.randomWords)||bootstrap.randomWords<0)
    refuse('invalid bootstrap declaration');
  const work=grid.reduce((sum,p)=>sum+counts.reduce((total,row)=>total+BigInt(row.k)*
    (BigInt(p[1].toString(2).length)+BigInt(BigInt(curve.n-1).toString(2).length)+2n),0n),0n)*(BigInt(bootstrap.B)+1n)+
    BigInt(curve.groups?.length??0)*(BigInt(counts.length)+1n)*(BigInt(bootstrap.B)+1n);
  const metadata={model:'single-dominant-factor@1' as const,lineage:curve.lineage,cardinality:curve.n,policy,
    meaning:'compatible with (c,p) under the declared model, on the declared p slices only' as const,
    workUnit:'rational-bit-and-group-bound' as const};
  if(work>BigInt(policy.budget))return {...metadata,status:'unmeasured' as const,cause:'unanimity-fit/budget',required:String(work)};
  const compatible=slices(counts,curve.n,grid,tolerance);
  let groups:readonly UnanimityGroup[]|undefined;
  if(curve.groups!==undefined){
    if(!Array.isArray(curve.groups)||!curve.groups.length||curve.groups.some(group=>!group)||new Set(curve.groups.map(group=>group.id)).size!==curve.groups.length)
      refuse('invalid or duplicate sampling groups');
    for(const group of curve.groups){
      if(!group||typeof group.id!=='string'||!group.id||!Array.isArray(group.outcomes)||group.outcomes.length!==counts.length||
        group.outcomes.some((item:UnanimityGroup['outcomes'][number])=>!item||typeof item.unanimous!=='boolean'||!counts.some(row=>row.k===item.k))||
        new Set(group.outcomes.map((item:UnanimityGroup['outcomes'][number])=>item.k)).size!==counts.length)
        refuse('complete paired size outcomes required');
    }
    groups=[...curve.groups].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
    for(const row of counts)if(row.trials!==groups.length||row.unanimous!==groups.filter(group=>group.outcomes.find(item=>item.k===row.k)!.unanimous).length)
      refuse('group outcomes do not reproduce counts');
  }
  const causes:string[]=[];
  if(counts.filter(row=>row.k>1).length<2)causes.push('too few informative sizes');
  if(counts.every(row=>row.unanimous===row.trials))causes.push('perfect unanimity cannot distinguish p=0 from c=1');
  if(curve.n===2&&compatible.some(slice=>compatible.some(other=>
    compare(add([BigInt(slice.p.numerator),BigInt(slice.p.denominator)],
      [BigInt(other.p.numerator),BigInt(other.p.denominator)]),one)===0&&
    slice.p.numerator+'/'+slice.p.denominator!==other.p.numerator+'/'+other.p.denominator)))
    causes.push('binary p versus 1-p ambiguity');
  if(!compatible.length)causes.push('no compatible parameter slice under the declared tolerance');
  const replicas:ReturnType<typeof slices>[]=[],wordsLimit=bootstrap.randomWords;
  let x=bootstrap.seed>>>0,words=0;
  const exhausted=Symbol('unanimity-fit/random-words');
  function index(N:number){
    const limit=Math.floor(4294967296/N)*N;
    for(;;){if(words>=wordsLimit)throw exhausted;words++;x^=x<<13;x^=x>>>17;x^=x<<5;const value=x>>>0;if(value<limit)return value%N;}
  }
  let uncertaintyCause:string|undefined;
  if(!groups||bootstrap.B===0)uncertaintyCause=groups?'bootstrap not requested':'sampling groups not handed; size dependence unknown';
  else{
    if(groups.length>4294967296)refuse('sampling population exceeds declared PRNG index range');
    try{for(let b=0;b<bootstrap.B;b++){
      const hits=counts.map(()=>0);
      for(let i=0;i<groups.length;i++){
        const group=groups[index(groups.length)]!;
        counts.forEach((row,j)=>{if(group.outcomes.find(item=>item.k===row.k)!.unanimous)hits[j]++;});
      }
      replicas.push(slices(counts.map((row,i)=>({...row,unanimous:hits[i]!})),curve.n,grid,tolerance));
    }}catch(error){if(error!==exhausted)throw error;uncertaintyCause='unanimity-fit/random-words';}
  }
  return {...metadata,status:causes.length?'unmeasured' as const:'measured' as const,
    ...(causes.length?{cause:causes.join('; ')}:{}),compatible,
    identification:{status:'unmeasured' as const,cause:'finite slices do not certify continuous parameter identification',diagnostics:causes},
    uncertainty:uncertaintyCause?{status:'unmeasured' as const,cause:uncertaintyCause,words}:
      {status:'measured' as const,procedure:'paired-group-bootstrap-regions@1' as const,replicas,words,
        interpretation:'empirical replicate regions; not a guaranteed confidence set' as const}};
}
