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
const lawTokens:Readonly<Record<string,string>>={'l7-tolerant-k':'L7:','l8-phase-defect':'L8:','l9-mix-loss':'L9:'};
const groups={...tokens,...lawTokens};
const paths=(group:string)=>['docs/measures.md','samples/measures/'+group+'.json',
  group in lawTokens?'vectors/laws/'+group+'.json':'vectors/measures/'+group+'.cli.json',
  group in lawTokens?'vectors/laws/implementation-043.json':'vectors/measures/implementation.json'];
const digest=(text:string)=>'sha256:'+createHash('sha256').update(text).digest('hex');
type HostCapture=Readonly<{place:string;case:'yes'|'no';input:string;stdinSha256:string;status:number|null;
  runtimeMs:number;stdout:string;stderr:string;stdoutSha256:string;stderrSha256:string;
  repeat?:Readonly<{status:number|null;runtimeMs:number;stdoutSha256:string;byteIdentical:boolean}>}>;
const json=(text:string,what:string):any=>{try{return JSON.parse(text);}catch{return refuse('malformed '+what);}};
// Only explicitly approximate noninteger numerical outputs admit this tolerance.
function same(a:unknown,b:unknown):boolean {
  if(a===b)return true;
  if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Number.isFinite(b)&&
    !Number.isInteger(a)&&!Number.isInteger(b)&&Math.abs(a-b)<=1e-12;
  if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>same(v,b[i]));
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
    const x=a as Record<string,unknown>,y=b as Record<string,unknown>,keys=Object.keys(x).sort();
    return JSON.stringify(keys)===JSON.stringify(Object.keys(y).sort())&&keys.every(k=>same(x[k],y[k]));
  }
  return false;
}
function inspectLaw(group:string,read:(path:string)=>string){
  const sample=json(read(paths(group)[1]!),group+' samples'),vector=json(read(paths(group)[2]!),group+' vector'),native=vector.nativeCapture;
  if(!native||native.instrument!=='@lapxo/bound@0.1.8'||native.mode!=='published-host-ABI'||
    native.hostSha256!=='sha256:b0f52ce76b88ed793543897a0bef490414bfb4af2f5b876a3665dabf8583f879')refuse('host identity differs '+group);
  if(native.fullFold!==false||native.admission!==false||native.signatures!==false)refuse('host capture overstates admission '+group);
  if(native.implementation!==paths(group)[3]||digest(read(paths(group)[3]!))!==native.implementationSha256)
    refuse('implementation inventory differs '+group);
  const inventory=json(read(paths(group)[3]!),group+' inventory');
  if(!Array.isArray(inventory)||!inventory.length||new Set(inventory.map(m=>m.path)).size!==inventory.length)
    refuse('ambiguous implementation inventory');
  for(const m of inventory){
    if(!/^(src|test\/support)\/[A-Za-z0-9_./-]+\.js$/.test(m.path)||m.path.split('/').includes('..'))refuse('invalid implementation coordinate');
    if(digest(readFileSync(new URL('../../'+m.path,import.meta.url),'utf8'))!==m.sha256)refuse('current reader implementation differs '+m.path);
  }
  const captures=native.captures as HostCapture[];
  if(!Array.isArray(captures)||captures.length!==4||captures.some(c=>!c||typeof c.place!=='string'))
    refuse('two complete yes/no places required '+group);
  const places=new Set(captures.map(c=>c.place)),pairs=new Set(captures.map(c=>c.place+'/'+c.case));
  if(places.size!==2||pairs.size!==4||[...places].some(p=>typeof p!=='string'||!p.trim()))refuse('ambiguous capture places '+group);
  if(native.limits?.timeoutMs!==5000||native.limits?.responseBytes!==65536)refuse('capture limits differ '+group);
  for(const c of captures){
    if(!['yes','no'].includes(c.case)||typeof c.input!=='string'||typeof c.stdout!=='string'||typeof c.stderr!=='string'||
      digest(c.input)!==c.stdinSha256||digest(c.stdout)!==c.stdoutSha256||digest(c.stderr)!==c.stderrSha256)
      refuse('capture bytes differ '+group);
    if(c.status===null||!Number.isFinite(c.runtimeMs)||c.runtimeMs<0||c.runtimeMs>5000||
      Buffer.byteLength(c.stdout)+Buffer.byteLength(c.stderr)>65536)refuse('incomplete or over-budget capture '+group);
    const request=json(c.input,group+' request'),handed={...sample[c.case],group,place:c.place};
    if(!Array.isArray(request)||request.length!==1||request[0]?.protocol!=='bound-lock/1'||request[0]?.verb!=='read'||
      request[0]?.rootScope!=='inputs/sample.json'||request[0]?.region!=='measure'||request[0]?.files?.length!==1||
      request[0]?.files[0]?.place!=='inputs/sample.json'||request[0]?.files[0]?.text!==JSON.stringify(handed)+'\n')
      refuse('captured input differs '+group);
    const answer=json(c.stdout.trim(),group+' response');
    if(!Array.isArray(answer)||answer.length!==1||answer[0]?.protocol!=='bound-lock/1')refuse('invalid host response '+group);
    if(c.case==='yes'){
      const claims=answer[0]?.claims;
      if(c.status!==0||answer[0]?.kind!=='fact'||!Array.isArray(claims)||claims.length!==1||
        claims[0]?.scope!=='measurement/'+group+'/'+c.place||claims[0]?.measure!=='result'||
        claims[0]?.bound?.kind!=='enumerated'||claims[0]?.bound?.values?.length!==1)refuse('positive capture missing '+group);
      if(!same(json(claims[0].bound.values[0],group+' result'),evaluate(handed as Parameters<typeof evaluate>[0])))
        refuse('captured output differs '+group);
      if(!c.repeat||c.repeat.status!==0||c.repeat.byteIdentical!==true||c.repeat.stdoutSha256!==c.stdoutSha256||
        !Number.isFinite(c.repeat.runtimeMs)||c.repeat.runtimeMs<0||c.repeat.runtimeMs>5000)refuse('repeated execution missing '+group);
    }else{
      const expected=sample.no?.expectedRefusal;
      if(typeof expected!=='string'||!expected.startsWith('REFUSE')||answer[0]?.kind!=='refuse'||
        typeof answer[0]?.why!=='string'||!answer[0].why.includes(expected))refuse('named negative missing '+group);
      let actual='';try{evaluate(handed as Parameters<typeof evaluate>[0]);}catch(e){actual=String(e);}
      if(!actual.includes(expected))refuse('negative sample does not refuse '+group);
    }
  }
}
export function inspect(inputs:readonly Input[]){
  const files=new Map(inputs);
  if(files.size!==inputs.length)refuse('duplicate handed input');
  const read=(path:string):string=>{const text=files.get(path);if(text===undefined)return refuse('input not handed '+path);return text;};
  const docs=read('docs/measures.md'),out=[];
  for(const [group,token] of Object.entries(groups)){
    if(!files.has(paths(group)[2]!))continue;
    if(!docs.includes(token))refuse('contract missing '+group);
    if(group in lawTokens){
      inspectLaw(group,read);
      out.push({scope:'publication/laws/'+group,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}});
      continue;
    }
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
  return Object.keys(groups).filter(group=>handed.has(paths(group)[2]!)).map(group=>{
    if(paths(group).some(path=>!handed.has(path)))refuse('unhanded quartet '+group);
    return canonical({scope:(group in lawTokens?'publication/laws/':'publication/measures/')+group,role:'reads',form:'alphabet',measure:'reads',
      value:paths(group).join('|'),at:'receipt:1'});
  });
}
export function receipt(asked:Asked){
  return inspect(asked.lines.filter(line=>line.measure==='text'&&line.about!==undefined).map(line=>[line.scope,line.about!] as const));
}
