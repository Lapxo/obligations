import {chain,fromScale,declaration,order,type Unit} from '@lapxo/obligations';
import {cell,parts,mark,refine,observe,live,state,type Obligatory} from '@lapxo/obligations/views/field';
import {premium} from '@lapxo/obligations/price';
import {marginalInformation,mixProjectionLoss} from '@lapxo/obligations/measures';

// Acceptance consumer only: public operations and declared finite examples.
// It neither admits declarations nor authenticates actors or creates a second cell.
const fail=(why:string):never=>{throw Error('REFUSE·foundation/'+why)};
export function evaluate(input:any):unknown {
 if(!input||input.profile!=='foundation-reading@1')fail('model-required');
 const before=JSON.stringify(input);
 let result:unknown;
 if(input.kind==='cell-declaration'){
  const c=chain(input.levels),L=fromScale(c);
  const make=(x:any):Obligatory<Unit>=>({...cell(x.at,x.epoch,x.seen,x.restsOn),marks:(x.marks??[]).map(mark)});
  const held=make(input.cell),world=new Map<string,any>((input.world??[]).map((x:any)=>[x.at,make(x)]));
  const p=parts(L,held,world),unit=p.floor;
  result={floor:p.floor,ceiling:p.ceiling,required:p.required,signed:p.signed,origins:p.origins,rest:p.rest,
   declaration:declaration(c,{subject:input.cell.at,floor:unit.floor,ceiling:p.ceiling.ceiling}),
   refined:refine(held,input.resolution),state:state(L,held,world)};
 }else if(input.kind==='declaration-provenance'){
  if(!Array.isArray(input.claims)||input.claims.some((c:any)=>typeof c.id!=='string'||!c.id||typeof c.origin!=='string'||!c.origin)||new Set(input.claims.map((c:any)=>c.id)).size!==input.claims.length)fail('claim-identity-required');
  const held=cell(input.at,input.epoch,input.claims),beforeLive=live(held.seen);
  let next;try{next=observe(held,input.withdrawal,-1)}catch(e){if(e&&typeof e==='object'&&'code' in e)fail(String(e.code));throw e}const after=live(next.seen);
  result={before:beforeLive,after,history:next.seen,epoch:next.epoch,
   authentication:'not-assessed',independentCauses:'unmeasured'};
 }else if(input.kind==='valuation-residual'){
  if(typeof input.model!=='string'||!input.model||typeof input.unit!=='string'||!input.unit)fail('valuation-model-required');
  const c=order(input.levels,input.leq),values=input.values;
  if(!Array.isArray(values)||values.length!==c.levels.length||values.some((x:any)=>!Number.isFinite(x)))fail('valuation-domain');
  if(!Number.isSafeInteger(input.workBudget)||input.workBudget<2*values.length**3+values.length**2)fail('budget');
  if(values[c.bottomIx]!==0)fail('valuation-normalization');
  for(let a=0;a<values.length;a++)for(let b=0;b<values.length;b++)if(c.leq(a,b)&&values[a]>values[b]+1e-12)fail('valuation-monotonicity');
  const mutual=(a:number,b:number)=>values[a]+values[b]-values[c.higher(a,b)];
  for(let a=0;a<values.length;a++)for(let b=0;b<values.length;b++)if(c.leq(a,b))for(let z=0;z<values.length;z++){
   if(mutual(a,z)>mutual(b,z)+1e-12||mutual(z,a)>mutual(z,b)+1e-12)fail('valuation-data-processing');
  }
  if(!Array.isArray(input.entropyTables)||input.entropyTables.length!==values.length)fail('entropy-model-required');
  for(const [i,probabilities] of input.entropyTables.entries()){const alphabet=probabilities.map((_:unknown,j:number)=>String(j));
   const entropy=mixProjectionLoss({factors:[{id:'declared-state',weight:'1'}],alphabet,configurations:alphabet.map((id:string)=>({id,values:[id]})),prior:{kind:'explicit',probabilities:probabilities.map((p:string,j:number)=>({configuration:String(j),p}))}},input.numericPolicy);
   if(entropy.status!=='measured'||Math.abs(entropy.configurationBits-values[i])>1e-12)fail('entropy-table-differs');
  }
  const [x,y]=input.pair,residual=mutual(x,y)-values[c.lower(x,y)],g=premium(c,(i)=>values[i],x,y);
  if(Math.abs(g-residual)>1e-12)fail('premium-residual');
  // Existing information engine supplies the XOR countermodel; no second entropy implementation.
  const m=input.xorModel,info=marginalInformation(m,[[m.sources[0].id,m.sources[1].id],[m.sources[1].id,m.sources[0].id]],input.numericPolicy);
  if(info.status!=='measured')return fail('xor-model-unmeasured');
  const alone=info.readings.map(r=>r.steps[0]!.deltaInformation),together=info.readings[0]!.totalInformation;
  if(alone.some(v=>Math.abs(v)>1e-12)||Math.abs(together-1)>1e-12)fail('xor-countermodel');
  result={model:input.model,unit:input.unit,valuationClass:'finite-declared-data-processing',residual,premium:g,
   xor:{alone,together,informationValuation:'outside-universal-class'},
   supportWithZeros:'open',NAdmissibility:'open'};
 }else fail('unsupported-reading');
 if(JSON.stringify(input)!==before)fail('input-mutated');
 return result;
}
export function validate(input:any){
 const actual=evaluate(input);
 // Expected results are sealed analytic vectors, never an authority claim.
 if(JSON.stringify(actual)!==JSON.stringify(input.expected))fail('answer-differs');
 return actual;
}
