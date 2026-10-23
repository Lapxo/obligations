import {decisionInformation,mutualInformation} from '@lapxo/obligations/measures';
import {evaluate} from './declared-relations-reader.ts';
import {rational,sub,zero,pack} from '../../src/measures/rational.ts';
const fail=(s:string):never=>{throw Error('REFUSE·decision-refinements/'+s)};
const need:(b:unknown,s:string)=>asserts b=(b,s)=>{if(!b)fail(s)};
const near=(a:number,b:number)=>Math.abs(a-b)<1e-12;
export function validate(x:any){
 need(x?.profile==='decision-refinements@1'&&x.modelFamily==='declared-loss-and-decoder-boundaries@1','model-family-required');
 need(x.concentration==='Lean-open'&&x.threshold?.uniformBoundStatus==='Lean-open','unproved-uniform-bound');
 need(x.asymptoticClaim==='not-inferred-from-finite-cases'&&x.evidence==='fixed-analytic-model','unsupported-asymptotic-claim');
 const threshold=evaluate('copy-threshold-boundaries',x.threshold,new Map());
 if(x.request==='universal-estimation-threshold')fail('no-universal-estimation-threshold');
 need(x.request==='conditional-refinements','unknown-request');
 const loss=evaluate('decision-estimation',x.loss,new Map()) as {minimizers:string[]}[];
 need(loss.length===3&&loss[0]!.minimizers.length===1&&loss[1]!.minimizers.length===1&&loss[0]!.minimizers[0]!==loss[1]!.minimizers[0]&&loss[2]!.minimizers.length===x.loss.actions.length,'loss-or-tie-boundary');
 need(x.numericReporting?.rendering==='binary64-toFixed'&&x.numericReporting?.digits===12&&x.numericReporting?.tolerance==='1e-12','numeric-reporting-required');
 const c=x.capacity;need(c?.model==='single-dominant-factor@1'&&c.loss==='zero-one'&&c.prior==='uniform-truth','capacity-family-required');
 need(c.tie==='uniform-over-maximizers'&&JSON.stringify(c.rules)===JSON.stringify(['plurality-uniform-ties@1','posterior-map-uniform-ties@1']),'decoder-required');
 need(Array.isArray(c.cases)&&c.cases.length===2&&new Set(c.cases.map((r:any)=>r.id)).size===2&&c.cases.every((r:any)=>typeof r.id==='string'&&r.id.length>0),'named-cases-required');
 const cases=c.cases.map((r:any)=>{
  const posterior=mutualInformation(r.k,r.model,c.policy),plurality=decisionInformation(r.k,r.model,c.rules[0],c.policy),map=decisionInformation(r.k,r.model,c.rules[1],c.policy);
  need(posterior.status==='measured'&&plurality.status==='measured'&&map.status==='measured'&&'decision' in plurality&&'decision' in map,'enumeration-budget');
  need(near(posterior.value,plurality.value)&&near(posterior.value,map.value),'posterior-differs');
  need(plurality.decision.information<=posterior.value+1e-12&&map.decision.information<=posterior.value+1e-12,'data-processing');
  const difference=sub(rational(map.decision.accuracy),rational(plurality.decision.accuracy));need(difference[0]>=zero[0],'Bayes-risk-boundary');
  return {id:r.id,parameters:posterior.parameters,conditions:posterior.conditions,policy:posterior.policy,posteriorInformationBits:posterior.value.toFixed(12),plurality:{rule:plurality.decision.rule,accuracy:plurality.decision.accuracy,informationBits:plurality.decision.information.toFixed(12),joint:plurality.decision.joint},map:{rule:map.decision.rule,accuracy:map.decision.accuracy,informationBits:map.decision.information.toFixed(12),joint:map.decision.joint},accuracyGain:pack(difference),loss:c.loss,prior:c.prior};
 });
 need(cases[0]!.posteriorInformationBits==='1.000000000000'&&cases[0]!.plurality.accuracy.numerator==='0'&&cases[0]!.map.accuracy.numerator===cases[0]!.map.accuracy.denominator,'invertible-channel-boundary');
 return {status:'conditional-refinements-confirmed',modelFamily:x.modelFamily,place:x.place,estimate:{states:x.loss.states,prior:x.loss.prior,unit:x.loss.estimateUnit},loss,threshold,cases,numericReporting:x.numericReporting,unitBoundary:{information:'bits; binary64-log2 declared',accuracy:'exact rational probability',loss:x.loss.lossUnit},authority:'not-inferred',universalEstimationThreshold:'not-established',concentration:x.concentration,asymptoticClaim:x.asymptoticClaim,experiments:0};
}
