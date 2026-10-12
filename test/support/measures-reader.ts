/** Native reading adapter. Algorithms are imported from their maintained source, never bundled into samples. */
import {chain} from '../../src/lattice/order.ts';
import {unit,state} from '../../src/debit/unit.ts';
import {errorCovariance,participationRatio,spectrum,commonMass,loadings,commonMassOf,
  unanimityFloor,unanimityThreshold,dissentExperiment,interestExperiment,descentCount,
  evaluateM3,probeUpdate,identifyM3,experimentM3,fitM3,dissentCertificate,
  type ErrorEvent,type ObservationPolicy,type NumericalPolicy,type UnanimityModel,
  type ExperimentPolicy,type Descent,type ModelM3,type EvaluationPolicy,
  type IdentificationInput,type IdentificationPolicy,type M3ExperimentPolicy,
  type FitStructure,type FitPolicy} from '../../src/measures/index.ts';
import {capacityBound,capacityP0,mutualInformation,unanimityNoFactor,decisionInformation,
  fitUnanimityModel,coincidenceExcess,type CapacityModel,type CapacityPolicy,type DecisionRule,
  type UnanimityCurve,type UnanimityFitPolicy,type ValueReading,type TruthReading,
  type CoincidenceReference,type CoincidencePolicy} from '../../src/measures/index.ts';
import {unanimityExperiment,type UnanimityExperiment} from './unanimity-experiment.ts';

type Named = Readonly<{place:string}>;
type Sample = Named & (
  Readonly<{group:'observations';rows:readonly ErrorEvent[];policy:ObservationPolicy}> |
  Readonly<{group:'spectrum';rows:readonly ErrorEvent[];matrix?:readonly (readonly number[])[];
    origins:readonly string[];observationPolicy:ObservationPolicy;policy:NumericalPolicy;tau:number}> |
  Readonly<{group:'unanimity';model:UnanimityModel;k:number;searchLimit:number;claim?:string;
    experiment:ExperimentPolicy;bias:number;shared:boolean}> |
  Readonly<{group:'descent';graph:readonly Descent[];cell:string}> |
  Readonly<{group:'m3';models:readonly Readonly<{name:string;model:ModelM3}>[];
    policy:EvaluationPolicy;identifications:readonly IdentificationInput[];
    identificationPolicy:IdentificationPolicy;experiment:M3ExperimentPolicy;
    fits:readonly Readonly<{rows:readonly ErrorEvent[];structure:FitStructure;policy:FitPolicy}>[]}> |
  Readonly<{group:'capacity';model:CapacityModel;k:number;ks?:readonly number[];policy:CapacityPolicy}> |
  Readonly<{group:'decisions';model:CapacityModel;k:number;rule:DecisionRule;policy:CapacityPolicy}> |
  (Readonly<{group:'unanimity-fit';policy:UnanimityFitPolicy}> &
    (Readonly<{curve:UnanimityCurve}>|Readonly<{experiment:UnanimityExperiment}>)) |
  Readonly<{group:'coincidence';rows:readonly ValueReading[];truth:readonly TruthReading[];
    selection:readonly string[];reference:CoincidenceReference;policy:CoincidencePolicy}>);

export function evaluate(sample:Sample) {
  if(!sample||typeof sample.place!=='string'||!sample.place)throw new Error('REFUSE·measure unnamed sample');
  const scale=chain(['off','on']);
  const cells=[unit('free',{floor:'off',ceiling:'on'}),unit('required',{floor:'on',ceiling:'on'}),
    unit('forbidden',{floor:'off',ceiling:'off'}),unit('conflict',{floor:'on',ceiling:'off'})];
  const states=cells.map(cell=>state(scale,cell));
  switch(sample.group){
    case 'observations':return {result:errorCovariance(sample.rows,sample.policy),states};
    case 'spectrum':{
      const cov=sample.matrix?{status:'measured' as const,origins:sample.origins,events:[],matrix:sample.matrix}:
        errorCovariance(sample.rows,sample.observationPolicy);
      const eigen=spectrum(cov,sample.policy);
      return {result:{rank:sample.matrix?'unmeasured':participationRatio(cov),commonMass:commonMass(eigen),
        loadings:loadings(eigen),subset:commonMassOf(eigen,sample.origins,sample.tau),state:states[0]},states};
    }
    case 'unanimity':{
      const sequence=[1,2,3].map(k=>unanimityFloor(sample.model,k));
      if(sample.claim==='monotone-from-one'&&sequence[1]!.status==='measured'&&sequence[0]!.status==='measured'&&
        sequence[1]!.value<sequence[0]!.value)throw new Error('REFUSE·measure T1 monotonicity counterexample '+
          JSON.stringify({sequence,threshold:unanimityThreshold(sample.model,sample.searchLimit)}));
      return {result:{F:unanimityFloor(sample.model,sample.k),threshold:unanimityThreshold(sample.model,sample.searchLimit),
        dissent:dissentExperiment(sample.model,sample.k,sample.experiment),
        interest:interestExperiment(sample.model,sample.bias,sample.shared,sample.experiment),sequence},states};
    }
    case 'descent':return {result:descentCount(sample.graph,sample.cell),states};
    case 'capacity':{
      const counts=sample.ks??[sample.k];
      if(!Array.isArray(counts)||!counts.length||new Set(counts).size!==counts.length)throw new Error('REFUSE·measure ambiguous capacity sizes');
      return {result:{bound:capacityBound(sample.model.n,sample.model.c,sample.policy),
        p0:capacityP0(sample.model.n,sample.model.c,sample.policy),
        unanimity:unanimityNoFactor(sample.k,sample.model.n,sample.model.p,sample.policy),
        information:counts.map(k=>mutualInformation(k,sample.model,sample.policy))},states};
    }
    case 'decisions':return {result:decisionInformation(sample.k,sample.model,sample.rule,sample.policy),states};
    case 'unanimity-fit':{
      if('curve' in sample&&'experiment' in sample)throw new Error('REFUSE·measure two sources for the fitting curve');
      if('curve' in sample)return {result:fitUnanimityModel(sample.curve,sample.policy),states};
      const experiment=unanimityExperiment(sample.experiment);
      if(experiment.status==='unmeasured')return {result:experiment,states};
      return {result:{procedure:experiment.procedure,words:experiment.words,counts:experiment.curve.counts,
        fit:fitUnanimityModel(experiment.curve,sample.policy)},states};
    }
    case 'coincidence':return {result:coincidenceExcess(sample.rows,sample.truth,sample.selection,sample.reference,sample.policy),states};
    case 'm3':{
      const first=sample.models[0];
      if(!first)throw new Error('REFUSE·model/M3 no sample model');
      return {results:sample.models.map(entry=>({name:entry.name,result:evaluateM3(entry.model,sample.policy)})),
        probes:['0.2','0.98','0.99','1'].map(error=>probeUpdate({numerator:'797',denominator:'10373'},error,64)),
        identification:sample.identifications.map(input=>identifyM3(input,sample.identificationPolicy)),
        experiment:experimentM3(first.model,sample.experiment),
        fitting:sample.fits.map(input=>fitM3(input.rows,input.structure,input.policy)),
        certificate:dissentCertificate(first.model,[]),states};
    }
    default:throw new Error('REFUSE·measure unknown quartet');
  }
}

export function observe(bytes:Uint8Array){
  const sample=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as Sample;
  return [{scope:'measurement/'+sample.group+'/'+sample.place,role:'writes' as const,measure:'result',
    bound:{kind:'enumerated' as const,values:[JSON.stringify(evaluate(sample))]}}];
}
