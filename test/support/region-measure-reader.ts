import {finiteRegionMeasure, type RegionMeasure} from '@lapxo/obligations/measures';

export function evaluate(input: RegionMeasure) {
  const result = finiteRegionMeasure(input, {budget:'1000'});
  if (result.status !== 'measured') throw Error('REFUSE·region-measure/budget');
  return result;
}

export function observe(bytes: Uint8Array) {
  const result = evaluate(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes)));
  return [{scope:'law/region-measure',role:'writes',measure:'count',bound:{kind:'interval',lo:1,hi:1}},
    {scope:'law/region-measure/result',role:'writes',measure:'result',bound:{kind:'enumerated',values:[JSON.stringify(result)]}}];
}
