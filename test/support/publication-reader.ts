import {canonical,parse} from '@lapxo/topos/wire';
import {evaluate} from './measures-reader.ts';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
type Input=readonly [string,string];
type Asked=Readonly<{lines:readonly Readonly<{scope:string;measure:string;about?:string}>[]}>;
type Capture=Readonly<{place:string;negative:boolean;events:readonly Readonly<{status:number|null;stdout:string;stderr:string}>[]}>;
const refuse=(cause:string):never=>{throw new Error('REFUSE·publication '+cause);};
const tokens:Readonly<Record<string,string>>={observations:'errorMatrix',spectrum:'spectrum',unanimity:'T1',
  descent:'descentCount',m3:'M/3',capacity:'capacityBound',decisions:'decisionInformation',
  'unanimity-fit':'fitUnanimityModel',coincidence:'coincidenceExcess'};
const paths=(group:string)=>['docs/measures.md','samples/measures/'+group+'.json','vectors/measures/'+group+'.cli.json','vectors/measures/implementation.json'];
export function inspect(inputs:readonly Input[]){
  const files=new Map(inputs);
  if(files.size!==inputs.length)refuse('duplicate handed input');
  const read=(path:string):string=>{const text=files.get(path);if(text===undefined)return refuse('input not handed '+path);return text;};
  const docs=read('docs/measures.md'),out=[];
  for(const [group,token] of Object.entries(tokens)){
    if(!files.has(paths(group)[2]!))continue;
    if(!docs.includes(token))refuse('contract missing '+group);
    const samples=JSON.parse(read(paths(group)[1]!)) as {yes:Parameters<typeof evaluate>[0];no:Parameters<typeof evaluate>[0]}[];
    const vector=JSON.parse(read(paths(group)[2]!)) as {instrument:string;implementation:string;captures:Capture[]};
    if(vector.instrument!=='@lapxo/bound@0.1.7')refuse('instrument differs from declared acceptance');
    const inventoryText=read(paths(group)[3]!);
    if('sha256:'+createHash('sha256').update(inventoryText).digest('hex')!==vector.implementation)refuse('implementation inventory differs '+group);
    const inventory=JSON.parse(inventoryText) as Readonly<{path:string;sha256:string}>[];
    if(!Array.isArray(inventory)||!inventory.length||new Set(inventory.map(member=>member.path)).size!==inventory.length)refuse('ambiguous implementation inventory');
    for(const member of inventory){
      if(!/^(src|test\/support)\/[A-Za-z0-9_./-]+\.js$/.test(member.path)||member.path.split('/').includes('..'))refuse('invalid implementation coordinate');
      const bytes=readFileSync(new URL('../../'+member.path,import.meta.url));
      if('sha256:'+createHash('sha256').update(bytes).digest('hex')!==member.sha256)refuse('current reader implementation differs '+member.path);
    }
    if(!Array.isArray(samples)||samples.length<2||new Set(samples.map(pair=>pair.yes.place)).size!==samples.length)
      refuse('two distinct sample places required '+group);
    for(const sample of samples){
      const positive=vector.captures.find(c=>c.place===sample.yes.place&&!c.negative);
      const negative=vector.captures.find(c=>c.place===sample.no.place&&c.negative);
      if(!positive||!negative)return refuse('yes/no capture missing '+group);
      const result=evaluate(sample.yes);
      const outputs=positive.events.filter(event=>event.status===0).flatMap(event=>event.stdout.split('\n').flatMap(line=>{
        const record=parse(line);
        return record.kind==='fact'&&record.value.fields.scope==='measurement/'+group+'/'+sample.yes.place&&
          record.value.fields.measure==='result'?[record.value.fields.value!]:[];
      }));
      if(outputs.length<2||outputs.some(value=>JSON.stringify(JSON.parse(value))!==JSON.stringify(result)))
        refuse('captured output differs '+group);
      let refused=false;
      try{evaluate(sample.no);}catch(error){if(String(error).includes('REFUSE'))refused=true;else throw error;}
      if(!refused||!negative.events.some(event=>event.status!==0&&/REFUSE/.test(event.stdout+event.stderr)))
        refuse('negative sample not paid '+group);
    }
    out.push({scope:'publication/measures/'+group,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}});
  }
  if(!out.length)refuse('no quartet handed');return out;
}
export function render(asked:Asked){
  const handed=new Set(asked.lines.filter(line=>line.measure==='text'&&line.about!==undefined).map(line=>line.scope));
  return Object.keys(tokens).filter(group=>handed.has(paths(group)[2]!)).map(group=>{
    if(paths(group).some(path=>!handed.has(path)))refuse('unhanded quartet '+group);
    return canonical({scope:'publication/measures/'+group,role:'reads',form:'alphabet',measure:'reads',
      value:paths(group).join('|'),at:'receipt:1'});
  });
}
export function receipt(asked:Asked){
  return inspect(asked.lines.filter(line=>line.measure==='text'&&line.about!==undefined).map(line=>[line.scope,line.about!] as const));
}
