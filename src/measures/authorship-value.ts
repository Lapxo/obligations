import {marginalInformation,type MarginalModel} from './marginal-information.ts';
import {probability} from './rational.ts';
import type {MixLossPolicy} from './mix-loss.ts';

const refuse=(cause:string):never=>{throw Error('REFUSE·authorship-value/'+cause);};

/** I(Y;X|K), K the binary count, under one finite joint prior.
 * A positive-support lemma identifies RI_H only when both Y values occur at each X.
 * Attribution is retained, not authenticated or merged by this reading.
 */
export function authorshipValue(model:MarginalModel,policy:MixLossPolicy){
  if(!model||model.model!=='finite-declared-joint@1'||!Array.isArray(model.atoms))
    return {status:'unmeasured' as const,cause:'authorship-value/joint-model-required' as const};
  if(!Array.isArray(model.sources)||!model.sources.length||model.sources.some(s=>!s||!Array.isArray(s.values)||
    s.values.length!==2||!s.values.includes('0')||!s.values.includes('1')))
    return refuse('binary-source-domain-required');
  if(!Array.isArray(model.truthValues)||model.truthValues.length!==2)
    return refuse('binary-truth-domain-required');
  const ids=model.sources.map(s=>s.id);
  if(model.atoms.some(a=>!a||!a.values||ids.some(id=>!Object.hasOwn(a.values,id)||
    (a.values[id]!=='0'&&a.values[id]!=='1'))))return refuse('atom-outside-domain');
  let countId='count';while(ids.includes(countId))countId+=':count';
  const counts=model.atoms.map(a=>String(ids.reduce((sum,id)=>sum+(a.values[id]==='1'?1:0),0)));
  const augmented:MarginalModel={...model,
    sources:[...model.sources,{id:countId,lineage:'deterministic-count-not-an-origin',values:[...new Set(counts)]}],
    atoms:model.atoms.map((a,i)=>({...a,values:{...a.values,[countId]:counts[i]!}}))};
  // Reuse validated exact masses, work accounting and the existing entropy projection.
  const measured=marginalInformation(augmented,[[countId,...ids]],policy);
  if(measured.status!=='measured')return measured;
  const steps=measured.readings[0]!.steps;
  const givenCount=steps[0]!.remainingConditionalEntropy;
  const givenConfiguration=steps[steps.length-1]!.remainingConditionalEntropy;
  const value=givenCount-givenConfiguration;
  const support=new Map<string,Set<string>>();
  for(const atom of model.atoms){
    if(probability(atom.p!)[0]===0n)continue;
    const key=JSON.stringify(ids.map(id=>atom.values[id]));
    const ys=support.get(key)??new Set<string>();ys.add(atom.truth);support.set(key,ys);
  }
  const fullSupport=[...support.values()].every(ys=>ys.size===2);
  return {status:'measured' as const,model:'finite-binary-authorship-value@1' as const,
    parameters:{joint:model,projection:'binary-sum' as const},policy,unit:'bits' as const,
    approximation:measured.approximation,required:measured.required,workUnit:measured.workUnit,
    valueBits:value,truthGivenCountBits:givenCount,truthGivenConfigurationBits:givenConfiguration,
    positiveConfigurations:support.size,bothTruthValuesAtEveryPositiveConfiguration:fullSupport,
    residual:fullSupport?{status:'identified' as const,bits:value,basis:'full-support-lemma' as const,
      commonPart:'information-equivalent-to-count' as const}:
      {status:'unmeasured' as const,cause:'authorship-value/support-with-zeros' as const},
    meaning:'I(Y;X|K) for the declared joint prior; zero iff conditional sufficiency, not iff exchangeability' as const};
}
