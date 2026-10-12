import {add,sub,mul,div,q,zero,one,equal,pack,probability,refuse,type Q,type Rational,type RationalInput} from './rational.ts';
export type Witness=Readonly<{id:string; privateError?:RationalInput}>;
export type Factor=Readonly<{id:string; index:number; members:readonly string[]; probability:RationalInput}>;
export type ModelM3=Readonly<{cell:string; cardinality:number; witnesses:readonly Witness[]; factors:readonly Factor[]; selection:readonly string[]}>;
export type EvaluationPolicy=Readonly<{budget:string}>;
export type Conditional=Readonly<{status:'measured';value:Rational;numerator:Rational;denominator:Rational}>|Readonly<{status:'unmeasured';cause:string;numerator:Rational;denominator:Rational}>;
export const conditions=Object.freeze(['ordered-governance','independent-factor-indicators','independent-private-indicators','independent-uniform-wrong-labels','handed-parameters'] as const);
type Prepared=Readonly<{witnesses:readonly Witness[]; factors:readonly Factor[]; private:readonly Q[]; rates:readonly Q[]}>;
type Configuration=Readonly<{governors:readonly number[]; mass:Q; fired:boolean}>;
const named=(s:string):boolean=>typeof s==='string'&&s.length>0;
export function validateM3(model:ModelM3):Prepared {
  if(!model||!Array.isArray(model.witnesses)||!Array.isArray(model.factors)||!Array.isArray(model.selection)||model.witnesses.some(w=>!w)||model.factors.some(f=>!f||!Array.isArray(f.members)))refuse('invalid model records');
  if(!named(model.cell)||!Number.isSafeInteger(model.cardinality)||model.cardinality<2)refuse('invalid cell or cardinality');
  const ids=model.witnesses.map(w=>w.id);
  if(ids.some(id=>!named(id))||new Set(ids).size!==ids.length)refuse('duplicate or absent witness');
  if(!model.selection.length||new Set(model.selection).size!==model.selection.length||model.selection.some(id=>!ids.includes(id)))refuse('invalid selection');
  const factors=[...model.factors].sort((a,b)=>a.index-b.index);
  if(new Set(factors.map(f=>f.id)).size!==factors.length||new Set(factors.map(f=>f.index)).size!==factors.length)refuse('duplicate factor identity or index');
  for(const f of factors)if(!named(f.id)||!Number.isSafeInteger(f.index)||new Set(f.members).size!==f.members.length||f.members.some(id=>!ids.includes(id)))refuse('invalid sharing set or order');
  const required=new Set([...model.selection,...factors.filter(f=>f.members.some(id=>model.selection.includes(id))).flatMap(f=>f.members)]);
  const allPrivate=model.witnesses.map(w=>{if(w.privateError===undefined){if(required.has(w.id))refuse('private probability absent for '+w.id);return zero;}return probability(w.privateError);});
  const allRates=factors.map(f=>probability(f.probability));
  const selected=model.selection.map(id=>model.witnesses[ids.indexOf(id)]!);
  const touching=factors.filter(f=>f.members.some(id=>model.selection.includes(id)));
  return {witnesses:selected,factors:touching,private:selected.map(w=>allPrivate[ids.indexOf(w.id)]!),rates:touching.map(f=>allRates[factors.indexOf(f)]!)};
}
function limit(policy:EvaluationPolicy):bigint {if(!policy||!/^\d+$/.test(policy.budget))refuse('invalid evaluator/budget');return BigInt(policy.budget);}
function bells(n:number,cap:bigint):bigint[] {
  let row=[1n];const result=[1n];
  for(let i=1;i<=n;i++){const next=[row[row.length-1]!];for(let j=1;j<=i;j++)next.push(next[j-1]!+row[j-1]!);row=next;result.push(row[0]!);if(row[0]!>cap)break;}
  return result;
}
function *configurations(input:Prepared,masses=true):Generator<Configuration> {
  const ids=input.witnesses.map(w=>w.id),governors=ids.map(()=>-1);
  function *walk(i:number,mass:Q,fired:boolean):Generator<Configuration>{
    if(i===input.factors.length){yield {governors:[...governors],mass,fired};return;}
    yield*walk(i+1,masses?mul(mass,sub(one,input.rates[i]!)):one,fired);
    const changed:number[]=[];for(let j=0;j<ids.length;j++)if(governors[j]===-1&&input.factors[i]!.members.includes(ids[j]!)){governors[j]=i;changed.push(j);}
    yield*walk(i+1,masses?mul(mass,input.rates[i]!):one,true);
    for(const j of changed)governors[j]=-1;
  }
  yield*walk(0,one,false);
}
function countWork(input:Prepared,cap:bigint):bigint {
  const k=input.witnesses.length,bell=bells(k+1,cap);
  if(bell.length<=k+1||bell[k+1]!>cap)return cap+1n;
  let factorConfigurations=1n;for(let i=0;i<input.factors.length;i++){factorConfigurations*=2n;if(factorConfigurations>cap)return cap+1n;}
  let total=0n;
  for(const c of configurations(input,false)){
    const free=c.governors.filter(g=>g===-1).length,groups=new Set(c.governors.filter(g=>g!==-1)).size;
    let choose=1n;for(let r=0;r<=free;r++){total+=choose*bell[groups+r]!;if(total>cap)return cap+1n;choose=choose*BigInt(free-r)/BigInt(r+1);}
  }
  return total;
}
export function conditional(a:Q,b:Q,cause:string):Conditional {return b[0]===0n?{status:'unmeasured',cause,numerator:pack(a),denominator:pack(b)}:{status:'measured',value:pack(div(a,b)),numerator:pack(a),denominator:pack(b)};}
export function evaluateM3(model:ModelM3,policy:EvaluationPolicy){
  const input=validateM3(model),cap=limit(policy),work=countWork(input,cap);
  const metadata={model:'M/3' as const,parameters:model,conditions,policy};
  if(work>cap)return {...metadata,status:'unmeasured' as const,cause:'evaluator/budget',requiredAtLeast:String(work)};
  const k=input.witnesses.length,wrong=BigInt(model.cardinality-1);
  let truth:Q=zero,falsehood:Q=zero,fired:Q=zero,majorityTrue:Q=zero,majorityFalse:Q=zero,majorityNone:Q=zero;
  for(const configuration of configurations(input)){
    if(configuration.mass[0]===0n)continue;
    const grouped=new Map<number,number>();configuration.governors.forEach(g=>{if(g!==-1)grouped.set(g,(grouped.get(g)??0)+1);});
    const weights=[...grouped.values()],free=configuration.governors.flatMap((g,i)=>g===-1?[i]:[]);
    function privatePatterns(i:number,mass:Q,correct:number):void {
      if(mass[0]===0n)return;
      if(i<free.length){const p=input.private[free[i]!]!;privatePatterns(i+1,mul(mass,sub(one,p)),correct+1);weights.push(1);privatePatterns(i+1,mul(mass,p),correct);weights.pop();return;}
      const L=weights.length,blocks:number[]=[];
      function partitions(label:number):void {
        if(label<L){for(let j=0;j<blocks.length;j++){blocks[j]!+=weights[label]!;partitions(label+1);blocks[j]!-=weights[label]!;}blocks.push(weights[label]!);partitions(label+1);blocks.pop();return;}
        const b=blocks.length;if(BigInt(b)>wrong)return;
        let assignments=1n;for(let j=0;j<b;j++)assignments*=wrong-BigInt(j);
        const probabilityMass=mul(mass,q(assignments,wrong**BigInt(L)));
        if(correct===k){truth=add(truth,probabilityMass);return;}
        if(correct===0&&b===1){falsehood=add(falsehood,probabilityMass);if(configuration.fired)fired=add(fired,probabilityMass);return;}
        if(2*correct>k)majorityTrue=add(majorityTrue,probabilityMass);
        else if(blocks.some(weight=>2*weight>k))majorityFalse=add(majorityFalse,probabilityMass);
        else majorityNone=add(majorityNone,probabilityMass);
      }
      partitions(0);
    }
    privatePatterns(0,configuration.mass,0);
  }
  const dissent=sub(sub(one,truth),falsehood),majorityMass=add(majorityTrue,majorityFalse),unanimity=add(truth,falsehood);
  let closedTruth:Q=one;for(const p of input.private)closedTruth=mul(closedTruth,sub(one,p));for(const c of input.rates)closedTruth=mul(closedTruth,sub(one,c));
  if(!equal(closedTruth,truth)||!equal(dissent,add(majorityMass,majorityNone)))refuse('partition mass identity');
  return {...metadata,status:'measured' as const,work:String(work),probabilities:{true:pack(truth),false:pack(falsehood),fired:pack(fired),dissent:pack(dissent),majorityTrue:pack(majorityTrue),majorityFalse:pack(majorityFalse),majorityNone:pack(majorityNone)},quantities:{phi:conditional(falsehood,unanimity,'no unanimity mass'),D:conditional(fired,unanimity,'no unanimity mass'),reliability:conditional(truth,unanimity,'no unanimity mass'),falseMajorityGivenDissent:conditional(majorityFalse,dissent,'no dissent mass'),falseMajorityGivenMajorityAndDissent:conditional(majorityFalse,majorityMass,'no majority mass')},reliabilityLabel:'P(correct | unanimous) under M/3 with handed parameters'};
}
export function probeUpdate(phi:RationalInput,error:RationalInput,cardinality:number){
  if(!Number.isSafeInteger(cardinality)||cardinality<2)refuse('invalid probe cardinality');
  const f=probability(phi),p=probability(error),a=div(mul(f,p),q(BigInt(cardinality-1))),b=mul(sub(one,f),sub(one,p));
  return {model:'M/3' as const,conditions:['independent-private-only-probe','independent-uniform-wrong-value'] as const,parameters:{phi,error,cardinality},result:conditional(a,add(a,b),'no extended unanimity mass')};
}
/** A handed configuration certificate; it makes no posterior or independence inference. */
export function dissentCertificate(model:ModelM3,fired:readonly string[]){
 validateM3(model);
 if(!Array.isArray(fired)||new Set(fired).size!==fired.length||fired.some(id=>!model.factors.some(f=>f.id===id)))refuse('invalid fired configuration');
 const selected=new Set(model.selection),active=model.factors.filter(f=>fired.includes(f.id)&&f.members.some(id=>selected.has(id)));
 const covering=active.filter(f=>model.selection.every(id=>f.members.includes(id)));
 const witnesses=covering.filter(f=>!active.some(earlier=>earlier.index<f.index&&!model.selection.every(id=>earlier.members.includes(id)))).map(f=>f.id);
 return {model:'M/3' as const,parameters:{model,fired},conditions,unanimityForced:witnesses.length>0,coveringFactors:witnesses,meaning:'observed dissent excludes this configuration only' as const};
}
