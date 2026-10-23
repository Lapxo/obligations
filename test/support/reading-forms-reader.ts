import{createHash}from'node:crypto';
import{cell,restOf}from'@lapxo/obligations/views/field';
import{maximumDiversity,normalizedEvidence,authorshipValue}from'@lapxo/obligations/measures';
import{validate as foundation}from'./foundation-reader.ts';
import{validate as decision}from'./decision-refinements-reader.ts';
const fail=(s:string):never=>{throw Error('REFUSE·reading-forms/'+s)};
const need:(b:unknown,s:string)=>asserts b=(b,s)=>{if(!b)fail(s)};
const sha=(s:string)=>'sha256:'+createHash('sha256').update(s).digest('hex');
export function validate(x:any,files:Map<string,string>){
 need(x?.profile==='reading-form-acceptance@1'&&x.request==='compose-declared-readings','reading-required');
 const load=(name:string)=>{const text=files.get(name);need(text!==undefined,'input-required '+name);return JSON.parse(text)};
 need(x.requirements==='contracts/reading-forms.requirements.json','requirements-required');const requirements=load(x.requirements);
 need(requirements.profile==='semantic-reading-requirements@1'&&JSON.stringify(requirements.requirements.map((r:any)=>r.id))===JSON.stringify(['attribution','measurement','decision','projection','withdrawal','support']),'requirements-differ');
 for(const r of requirements.requirements){const text=files.get(r.contract);need(text!==undefined&&sha(text)===r.contractDigest&&Array.isArray(r.needs)&&r.needs.length>0&&typeof r.producer==='string','contract-differs')}
 const e=requirements.normalizedEvidence;need(files.has(e.contract)&&sha(files.get(e.contract)!)===e.digest,'contract-differs');
 const f=x.fixtures;const c=load(f.cell),p=load(f.provenance),d=load(f.diversity),n=load(f.evidence),a=load(f.authorship),z=load(f.decision);
 const cellReading=foundation(c) as any,provenance=foundation(p) as any,decisionReading=decision(z);
 const diversity=maximumDiversity(d.model,d.policy),evidence=normalizedEvidence(n.model,n.policy),authorship=authorshipValue(a.model,a.policy);
 need(diversity.status==='measured'&&evidence.status==='measured'&&authorship.status==='measured','declared-measure-unmeasured');
 need(JSON.stringify(diversity.parameters.sources)===JSON.stringify(d.model.sources)&&JSON.stringify(evidence.parameters.sources)===JSON.stringify(n.model.sources)&&JSON.stringify(authorship.parameters.joint.sources)===JSON.stringify(a.model.sources),'attribution-lost');
 const missingSimilarity=maximumDiversity(undefined as any,d.policy),missingTruth=normalizedEvidence({...n.model,truth:undefined},n.policy),missingReference=normalizedEvidence({...n.model,referenceSource:undefined},n.policy),missingPrior=authorshipValue({...a.model,atoms:a.model.atoms.map(({p,...rest}:any)=>rest)},a.policy);
 need([missingSimilarity,missingTruth,missingReference,missingPrior].every(r=>r.status==='unmeasured'&&typeof r.cause==='string'),'missing-input-not-open');
 need(x.interpretation?.authentication==='not-assessed'&&x.interpretation?.authorityFromMeasure===false,'authority-not-inferred');need(x.interpretation?.mergeAuthorsOnZeroLoss===false,'projection-not-withdrawal');need(x.interpretation?.promoteUnmeasuredToZero===false,'unmeasured-not-zero');
 need(x.numericReporting?.rendering==='binary64-toFixed'&&x.numericReporting?.digits===12&&x.numericReporting?.realEqualityClaimed===false,'numeric-reporting-required');
 const s=x.support;need(typeof s.at==='string'&&Number.isSafeInteger(s.epoch)&&Array.isArray(s.restsOn)&&Array.isArray(s.world)&&typeof s.producer==='string'&&s.producer.length>0&&s.nextActionRef==='consumer/supply-declared-input'&&s.catalogMembership==='not-assessed','support-context-required');
 const held=cell(s.at,s.epoch,[],s.restsOn),world=new Map<string,any>(s.world.map((o:any)=>[o.at,cell(o.at,s.epoch,[],o.restsOn)])),rest=restOf(held,world),missing=rest.filter(name=>!world.has(name));need(missing.length>0,'missing-support-required');
 need(JSON.stringify(provenance.after)===JSON.stringify(p.expected.after)&&JSON.stringify(provenance.history)===JSON.stringify(p.expected.history),'withdrawal-history-differs');
 return {status:'reading-obligations-confirmed',place:x.place,requirementsDigest:sha(files.get(x.requirements)!),cell:cellReading,provenance,authentication:'not-assessed',independence:'not-inferred',measurements:{diversity:{model:diversity.model,parameters:diversity.parameters,policy:diversity.policy,unit:diversity.unit,value:diversity.value},evidence:{model:evidence.model,parameters:evidence.parameters,policy:evidence.policy,unit:evidence.unit,value:evidence.value.toFixed(12),approximation:evidence.approximation}},projection:{model:authorship.model,parameters:authorship.parameters,policy:authorship.policy,unit:authorship.unit,valueBits:authorship.valueBits.toFixed(12),supportHypothesis:authorship.bothTruthValuesAtEveryPositiveConfiguration,residualStatus:authorship.residual.status,...(authorship.residual.status==='unmeasured'?{residualCause:authorship.residual.cause}:{residualBasis:authorship.residual.basis}),withdrawalPermission:'not-inferred'},unmeasured:{missingSimilarity,missingTruth,missingReference,missingPrior},decision:decisionReading,support:{rest,missing,status:'open',cause:'support/missing-declared-content',producer:s.producer,nextActionRef:s.nextActionRef,catalogMembership:'not-assessed'},numericReporting:x.numericReporting,experiments:0,secondCell:false,authority:'not-inferred'};
}
