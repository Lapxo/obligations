import {marginalInformation} from '../../src/measures/marginal-information.ts';
import type {RationalInput} from '../../src/measures/rational.ts';

type Sample = {place:string;keyIdentifiers:readonly string[];declaredProvenance:readonly string[];
  copiedJoint:readonly (readonly [string,string,RationalInput])[];
  independentJoint:readonly (readonly [string,string,RationalInput])[];
  expected:{sharedInformationBits:number;independentInformationBits:number}};

export function evaluate(input: Sample) {
  const measure = (table: Sample['copiedJoint']) => {
    const result=marginalInformation({model:'finite-declared-joint@1',truthValues:[...new Set(table.map(row=>row[0]))],
      sources:[{id:'report',lineage:'declared-provenance',values:[...new Set(table.map(row=>row[1]))]}],
      atoms:table.map(([truth,report,p],i)=>({id:String(i),truth,values:{report},p}))},[['report']],{logarithm:'binary64-log2',budget:'1000'});
    if(result.status!=='measured')throw Error('REFUSE·key-lineage/joint-required');
    return result.readings[0]!.totalInformation;
  };
  const sharedInformationBits=measure(input.copiedJoint),independentInformationBits=measure(input.independentJoint);
  if(sharedInformationBits!==input.expected.sharedInformationBits||independentInformationBits!==input.expected.independentInformationBits)
    throw Error('REFUSE·key-lineage/countermodel');
  return {declaredKeys:[...new Set(input.keyIdentifiers)].length,declaredGroups:[...new Set(input.declaredProvenance)].length,
    sharedInformationBits,independentInformationBits,unit:'bits',approximation:'binary64-log2',
    authentication:'not established',causalIndependence:'not established by metadata'};
}

export function observe(bytes: Uint8Array) {
  const result=evaluate(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes)));
  return [{scope:'law/key-lineage-independence',role:'writes',measure:'count',bound:{kind:'interval',lo:1,hi:1}},
    {scope:'law/key-lineage-independence/result',role:'writes',measure:'result',bound:{kind:'enumerated',values:[JSON.stringify(result)]}}];
}
