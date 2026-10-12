import {add,sub,mul,div,pow,q,zero,one,pack,probability,type Q,type RationalInput} from './rational.ts';

export type ValueReading=Readonly<{event:string;origin:string;value:string}>;
export type TruthReading=Readonly<{event:string;value:string;kind:'truth'}>;
export type CoincidenceReference=Readonly<{model:'independent-uniform-wrong@1';values:readonly string[]}> & (
  Readonly<{marginals:'handed';errors:readonly Readonly<{origin:string;probability:RationalInput}>[]}> |
  Readonly<{marginals:'estimated-by-truth'}>);
export type CoincidencePolicy=Readonly<{minEvents:number;minEventsPerTruth:number;budget:string}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·coincidence '+cause);};
const named=(value:unknown):value is string=>typeof value==='string'&&value.length>0;

/** A descriptive event rate relative to a declared null; neither the ratio nor its sign identifies a cause. */
export function coincidenceExcess(rows:readonly ValueReading[],truth:readonly TruthReading[],
  selection:readonly string[],reference:CoincidenceReference,policy:CoincidencePolicy){
  if(!Array.isArray(rows)||!Array.isArray(truth)||!Array.isArray(selection)||!selection.length||
    selection.some(id=>!named(id))||new Set(selection).size!==selection.length)refuse('invalid selection or rows');
  if(!reference||reference.model!=='independent-uniform-wrong@1'||!Array.isArray(reference.values)||
    reference.values.length<2||reference.values.some(value=>!named(value))||new Set(reference.values).size!==reference.values.length)
    refuse('invalid declared reference');
  if(!policy||!Number.isSafeInteger(policy.minEvents)||policy.minEvents<1||
    !Number.isSafeInteger(policy.minEventsPerTruth)||policy.minEventsPerTruth<1||typeof policy.budget!=='string'||!/^\d+$/.test(policy.budget))
    refuse('invalid observation policy');
  // Upper bound on scans and selected event comparisons, before indexing any rows.
  const required=BigInt(rows.length)*(BigInt(selection.length)+1n)+BigInt(truth.length)+BigInt(reference.values.length)+BigInt(selection.length);
  const metadata={reference,policy,selection:[...selection].sort(),order:selection.length,
    interpretation:'coincidence relative to the declared reference; not causal identification' as const};
  if(required>BigInt(policy.budget))return {...metadata,status:'unmeasured' as const,cause:'coincidence/budget',required:String(required)};
  const selected=new Set(selection),alphabet=new Set(reference.values),truthByEvent=new Map<string,string>();
  for(const row of truth){
    if(!row||row.kind!=='truth'||!named(row.event)||!alphabet.has(row.value))refuse('invalid truth; probes require a separate declared contract');
    if(truthByEvent.has(row.event)&&truthByEvent.get(row.event)!==row.value)refuse('conflicting truth '+row.event);
    truthByEvent.set(row.event,row.value);
  }
  const events=new Map<string,Map<string,string>>();
  for(const row of rows){
    if(!row||!named(row.event)||!named(row.origin)||!alphabet.has(row.value))refuse('invalid value reading');
    if(!selected.has(row.origin))continue;
    const values=events.get(row.event)??new Map<string,string>();
    if(values.has(row.origin)&&values.get(row.origin)!==row.value)refuse('conflicting value '+row.event+'/'+row.origin);
    values.set(row.origin,row.value);events.set(row.event,values);
  }
  const ordered=[...events.keys()].sort();
  if(ordered.length<policy.minEvents)return {...metadata,status:'unmeasured' as const,cause:'insufficient observed events',events:ordered.length};
  if(ordered.some(event=>events.get(event)!.size!==selection.length||!truthByEvent.has(event)))
    return {...metadata,status:'unmeasured' as const,cause:'incomplete shared events or truth',events:ordered.length};
  const origins=[...selection].sort(),groups=new Map<string,{events:number;errors:number[]}>();
  let falseCoincidences=0;
  for(const event of ordered){
    const t=truthByEvent.get(event)!,values=origins.map(id=>events.get(event)!.get(id)!);
    if(values.every(value=>value===values[0])&&values[0]!==t)falseCoincidences++;
    const group=groups.get(t)??{events:0,errors:origins.map(()=>0)};
    group.events++;values.forEach((value,i)=>{if(value!==t)group.errors[i]++;});groups.set(t,group);
  }
  let handed:Q[]=[];
  if(reference.marginals==='handed'){
    if(!Array.isArray(reference.errors)||reference.errors.length!==origins.length||reference.errors.some(row=>!row)||
      new Set(reference.errors.map(row=>row.origin)).size!==origins.length||
      reference.errors.some(row=>!row||!selected.has(row.origin)))refuse('marginals must name exactly the selection');
    handed=origins.map(id=>probability(reference.errors.find(row=>row.origin===id)!.probability));
  }else if(reference.marginals!=='estimated-by-truth')refuse('unknown marginal procedure');
  if(reference.marginals==='estimated-by-truth'&&[...groups.values()].some(group=>group.events<policy.minEventsPerTruth))
    return {...metadata,status:'unmeasured' as const,cause:'insufficient events per observed truth',events:ordered.length};
  let expected:Q=zero;
  const strata=[...groups].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([value,group])=>{
    const errors=reference.marginals==='handed'?handed:group.errors.map(count=>q(BigInt(count),BigInt(group.events)));
    const baseline=div(errors.reduce(mul,one),pow(q(BigInt(reference.values.length-1)),origins.length-1));
    expected=add(expected,mul(q(BigInt(group.events),BigInt(ordered.length)),baseline));
    return {truth:value,events:group.events,marginals:origins.map((origin,i)=>({origin,error:pack(errors[i]!)})),reference:pack(baseline)};
  });
  const observed=q(BigInt(falseCoincidences),BigInt(ordered.length));
  return {...metadata,status:'measured' as const,events:ordered.length,falseCoincidences,observed:pack(observed),
    expected:pack(expected),delta:pack(sub(observed,expected)),
    ratio:expected[0]===0n?{status:'unmeasured' as const,cause:'zero reference mass'}:
      {status:'measured' as const,value:pack(div(observed,expected))},strata,
    uncertainty:{status:'unmeasured' as const,cause:'descriptive population only; no sampling design handed'}};
}
