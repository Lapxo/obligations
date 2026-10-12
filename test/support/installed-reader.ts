import {createHash} from 'node:crypto';
import {canonical} from '@lapxo/topos/wire';
type Member=Readonly<{path:string;sha256:string}>;
type Sample=Readonly<{format:string;name:string;version:string;exports:unknown;implementation:readonly Member[];tests:readonly string[];code:string}>;
type Event=Readonly<{status:number;stdout:string;stderr:string}>;
type Capture=Readonly<{name:string;code:string;tests:Event;exports:Event;check:Event|Readonly<{status:'pending';cause:'native-file-closure-not-yet-measured'}>}>;
type Asked=Readonly<{lines:readonly Readonly<{scope:string;measure:string;about?:string}>[]}>;
const digest=(text:string)=>'sha256:'+createHash('sha256').update(text).digest('hex');
const refuse=(cause:string):never=>{throw new Error('REFUSE·installed acceptance '+cause);};
const transcript=(event:Event,name:string):string=>{
  if(!event||event.status!==0||typeof event.stdout!=='string'||typeof event.stderr!=='string')return refuse(name+' failed or interrupted');
  return event.stdout;
};
/** The world's reading validates evidence. It never installs, executes, or grants a permission. */
export function inspect(inputs:readonly (readonly [string,string])[]){
  const handed=new Map(inputs);if(handed.size!==inputs.length)refuse('ambiguous input');
  const read=(name:string):string=>{const text=handed.get(name);if(text===undefined)return refuse('input not handed '+name);return text;};
  const sample=JSON.parse(read('samples/yes/installed-artifact.json')) as Sample;
  const negative=JSON.parse(read('samples/no/installed-artifact.json')) as Sample;
  const captures=JSON.parse(read('vectors/measures/installed-artifact.cli.json')) as {format:string;places:readonly Capture[]};
  const manifest=JSON.parse(read('package.json')) as {name:string;version:string;exports:Record<string,unknown>};
  if(sample.format!=='installed-acceptance/1'||negative.format!==sample.format||captures.format!==sample.format)refuse('unknown contract');
  if(sample.name!==manifest.name||sample.version!==manifest.version||JSON.stringify(sample.exports)!==JSON.stringify(manifest.exports))refuse('manifest changed');
  if(!Array.isArray(sample.implementation)||!sample.implementation.length||new Set(sample.implementation.map(member=>member.path)).size!==sample.implementation.length)
    refuse('ambiguous implementation');
  const current=[...handed.keys()].filter(name=>name.startsWith('dist/')&&name.endsWith('.js')).sort();
  if(JSON.stringify(current)!==JSON.stringify(sample.implementation.map(member=>member.path).sort()))refuse('implementation inventory changed');
  for(const member of sample.implementation)if(digest(read(member.path))!==member.sha256)refuse('implementation changed '+member.path);
  if(!Array.isArray(sample.tests)||!sample.tests.length||new Set(sample.tests).size!==sample.tests.length)refuse('unnamed tests');
  if(!Array.isArray(captures.places)||captures.places.length<2||new Set(captures.places.map(capture=>capture.name)).size!==captures.places.length)
    refuse('two distinct consumer places required');
  let missingClosures=0;
  for(const capture of captures.places){
    if(capture.code!==sample.code||!capture.name)refuse('capture identity differs');
    const tests=transcript(capture.tests,'tests');
    for(const name of sample.tests)if(!tests.split('\n').some(line=>line.startsWith('✔ '+name+' (')))refuse('test missing '+name);
    const counts=Object.fromEntries([...tests.matchAll(/^ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(match=>[match[1],Number(match[2])]));
    if(counts.tests!==sample.tests.length||counts.pass!==sample.tests.length||['fail','cancelled','skipped','todo'].some(key=>counts[key]!==0))refuse('tests incomplete');
    if(JSON.stringify(JSON.parse(transcript(capture.exports,'exports')))!==JSON.stringify(Object.keys(manifest.exports).filter(key=>key!=='./package.json')))
      refuse('export capture differs');
    if(capture.check?.status==='pending'){
      if(capture.check.cause!=='native-file-closure-not-yet-measured')refuse('unknown pending verification');
      missingClosures++;
    }else{
      const check=transcript(capture.check,'native check')+capture.check.stderr;
      if(!/^PASS\s+closed · 1 places · /m.test(check)||!/0 opened/.test(check)||/REFUSE|BLOCK/.test(check))refuse('native receipts open');
    }
  }
  if(sample.code!==digest(JSON.stringify(sample.implementation)))refuse('code identity differs');
  if(negative.code===sample.code||negative.implementation?.every(member=>sample.implementation.some(other=>other.path===member.path&&other.sha256===member.sha256)))
    refuse('negative sample does not differ');
  // Count each explicitly unmeasured closure; the 0..0 demand remains red until all are paid.
  return [{scope:'release/installed-artifact',role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:missingClosures,hi:missingClosures}}];
}
export function render(asked:Asked){
  const inputs=asked.lines.filter(line=>line.measure==='text'&&line.about!==undefined).map(line=>line.scope);
  if(!inputs.includes('samples/yes/installed-artifact.json'))return [];
  return [canonical({scope:'release/installed-artifact',role:'reads',form:'alphabet',measure:'reads',value:inputs.sort().join('|'),at:'receipt:1'})];
}
export function receipt(asked:Asked){return inspect(asked.lines.filter(line=>line.measure==='text'&&line.about!==undefined).map(line=>[line.scope,line.about!] as const));}
