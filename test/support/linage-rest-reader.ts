import {fitUnanimityModel} from '@lapxo/obligations/measures';
import {add,sub,mul,div,pow,q,rational,probability,pack,equal,one,zero,type Q} from '../../src/measures/rational.ts';
import {createHash} from 'node:crypto';
const fail=(name:string):never=>{throw Error('REFUSE·linage-rest '+name);};
const check=(ok:unknown,name:string):void=>{if(!ok)fail(name);};
const sha=(x:string)=>'sha256:'+createHash('sha256').update(x).digest('hex');
const compare=(a:Q,b:Q)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
const product=(r:number[],e:string[])=>r.map((v,i)=>mul(q(BigInt(v)),rational(e[i]!)));
export function rejectClaim(region:string,sample:any){
 if(region==='helly-comb'){
  check(sample.helly.universe.some((x:number)=>sample.helly.sets.every((set:number[])=>set.includes(x))),'comb-pairwise-is-not-global');return;
 }
 if(region==='resolution-encounters'){
  check(sample.resolution.countingModel!==undefined,'resolution-counting-model-required');fail('unsupported-counting-model');
 }
 if(region==='coordination'){
  const missing=structuredClone(sample);delete missing.coordination.privateJoint;evaluate(missing);return;
 }
 fail('unknown-region');
}
export function evaluate(sample:any){
 check(sample?.id==='linage-rest@1','sample-id');
 const {universe,sets}=sample.helly;
 check(JSON.stringify(universe)==='[0,1,2]'&&JSON.stringify(sets)==='[[0,1],[1,2],[0,2]]','finite-comb-domain');
 const pairs=[[0,1],[0,2],[1,2]].map(([a,b])=>({sets:[a,b],intersection:universe.filter((x:number)=>sets[a!].includes(x)&&sets[b!].includes(x))}));
 const triple=universe.filter((x:number)=>sets.every((s:number[])=>s.includes(x)));
 check(pairs.every(p=>p.intersection.length===1)&&triple.length===0,'comb-witness');
 const helly={classification:'law by counterexample with finite Lean certificate',pairs,triple,intervalT38Unchanged:true,notAUniversalHellyNumberClaim:true};
 const r=sample.resolution;
 check(JSON.stringify(r.resolutions)==='[1,2,3,4,5,7]'&&JSON.stringify(r.encounters)==='["4.8","5.74","5.2","5.86","5.19","6.04"]','historical-sample-projection');
 const products=product(r.resolutions,r.encounters);
 const counters=r.countertables.map((c:any)=>{const p=product(c.r,c.e),K=rational(c.K),N=rational(c.N);return {products:p.map(pack),monotone:p.every((v:Q,i:number)=>i===0||compare(v,p[i-1]!)>=0),floorHolds:p.every((v:Q)=>compare(v,K)>=0),ceilingHolds:p.every((v:Q)=>compare(v,N)<=0),handedK:pack(K),handedN:pack(N)};});
 check(counters[0].monotone===false&&!counters[1].floorHolds&&!counters[1].ceilingHolds,'resolution-countertables');
 const historicalNegative={products:product([1,2,3,4],['4','1','1','1']).map(pack),declaredFloor:pack(rational('4.8')),allBelowFloor:true,interpretation:'existing negative sample refutes its declared numeric floor; its prose about a rising product is incorrect'};
 const resolution={historicalNegative,classification:'open conjecture and finite diagnostic countertables',historicalProducts:products.map(pack),historicalProductsMonotone:products.every((v,i)=>i===0||compare(v,products[i-1]!)>=0),countertables:counters,universalBound:false,countingModelDeclared:false,wordIndependentJustified:false};
 const c=sample.coordination;
 check(c.privateJoint==='conditionally-iid-given-truth'&&c.active==='all-selected-sources-same-wrong-label','joint-conditional-independence-required');
 check(Number.isInteger(c.n)&&c.n>=2&&c.n<=6&&Array.isArray(c.sizes)&&c.sizes.every((L:number)=>Number.isInteger(L)&&L>=1&&L<=6),'enumeration-domain');
 const f=probability(c.f),e=probability(c.e),off=sub(one,f),n=c.n;
 const rows=c.sizes.map((L:number)=>{
  const privateCorrect=pow(sub(one,e),L),privateWrong=div(pow(e,L),pow(q(BigInt(n-1)),L-1));
  const U=add(f,mul(off,add(privateCorrect,privateWrong))),W=add(f,mul(off,privateWrong));
  // Enumerate the exact conditional distribution at truth=0, including the
  // activation branch. No pseudo-random trial is presented as a probability.
  let total:Q=zero,enumU:Q=zero,enumW:Q=zero,atoms=0;
  function visit(values:number[],p:Q){if(values.length<L){for(let v=0;v<n;v++)visit([...values,v],mul(p,v===0?sub(one,e):div(e,q(BigInt(n-1)))));return;}
   total=add(total,p);atoms++;if(values.every(x=>x===values[0])){enumU=add(enumU,p);if(values[0]!==0)enumW=add(enumW,p);}}
  visit([],off);total=add(total,f);enumU=add(enumU,f);enumW=add(enumW,f);
  check(equal(total,one)&&equal(enumU,U)&&equal(enumW,W),'enumeration-formula');
  return {L,conditionalTruth:0,privateAtoms:atoms,unanimity:pack(U),wrongUnanimity:pack(W),finiteExcessAboveF:pack(sub(U,f)),exactEnumerationMatches:true};
 });
 const counts=rows.map((row:any)=>({k:row.L,unanimous:Number(row.unanimity.numerator),trials:Number(row.unanimity.denominator)}));
 check(counts.every((r:any)=>Number.isSafeInteger(r.trials)),'count-overflow');
 const fitted=fitUnanimityModel({n,lineage:'declared-coordinated-group',counts},c.fittingPolicy);
 if(!('compatible' in fitted))return fail('existing-fit-budget');
 const fit=fitted;
 check(fit.compatible?.length===1&&equal([BigInt(fit.compatible[0]!.c.lo.numerator),BigInt(fit.compatible[0]!.c.lo.denominator)],f)&&equal([BigInt(fit.compatible[0]!.c.hi.numerator),BigInt(fit.compatible[0]!.c.hi.denominator)],f),'existing-fit-compatibility');
 // Active subgroups are disjoint, their activations independent, f/2 each.
 // At e=0 two groups of size 2 use different wrong labels 1 and 2.
 // All four agree only when neither group activates: (1-f/2)^2.
 const partialUnanimity=pow(sub(one,div(f,q(2n))),2);
 const coordination={classification:'declared-model measure, exact finite enumeration',model:{n,f:pack(f),e:pack(e),privateJoint:c.privateJoint,active:c.active},rows,existingFit:fit,
  degeneracies:{eZero:{unanimity:'1',wrongUnanimity:pack(f),identification:'unmeasured: U_L=1 at every L for any f'},binaryPrivatePerfectlyCorrelated:{n:2,e:'1/2',L:3,actualUnanimity:'1',iidUnanimity:'1/4',jointIndependence:false},twoPartialCauses:{n:3,L:4,e:'0',groups:[[0,1],[2,3]],activationPerGroup:pack(div(f,q(2n))),distinctWrongLabels:[1,2],allSourceUnanimity:pack(partialUnanimity),singleCauseWithEZeroUnanimity:'1',sumActivationProbabilities:pack(f)}},
  interpretation:'compatible f on the handed p slice only; no causal mechanism, intention, continuous identification or sampling guarantee',headInference:false};
 return {'helly-comb':helly,'resolution-encounters':resolution,coordination};
}
export const vectorIds=['helly-comb','resolution-encounters','coordination'] as const;
export const coordinates=['proofs/helly-comb.json','proofs/resolution-encounters.json','proofs/coordination.json','proofs/lean/Obligations/HellyComb.lean','vectors/laws/helly-comb.lean.json','samples/laws/linage-rest/yes.json','samples/laws/linage-rest/no.json','samples/yes/H1-uncertainty.json','samples/no/H1-uncertainty.json','vectors/laws/policy.json','src/measures/unanimity-fit.ts','src/measures/rational.ts','test/support/linage-rest-reader.ts',...vectorIds.map(id=>'vectors/laws/'+id+'.json')];
const scope='publication/evidence/linage-rest';
export function inspect(inputs:readonly (readonly [string,string])[]){
 const files=new Map(inputs);check(files.size===inputs.length,'duplicate-input');const read=(p:string)=>files.get(p)??fail('missing-input '+p);
 for(const p of coordinates)read(p);
 const result=evaluate(JSON.parse(read('samples/laws/linage-rest/yes.json')));
 const sourcePaths=coordinates.filter(p=>!vectorIds.some(id=>p==='vectors/laws/'+id+'.json'));
 for(const id of vectorIds){const v=JSON.parse(read('vectors/laws/'+id+'.json'));check(v.id===id+'@1','vector-id');check(JSON.stringify(v.anchors.map((a:any)=>a.path))===JSON.stringify(sourcePaths),'anchor-inventory');for(const a of v.anchors)check(sha(read(a.path))===a.sha256,'anchor-digest '+a.path);check(JSON.stringify(v.result)===JSON.stringify(result[id]),'captured-result-differs '+id);}
 const historical=JSON.parse(read('samples/yes/H1-uncertainty.json')).cases[0],positive=JSON.parse(read('samples/laws/linage-rest/yes.json')).resolution;
 check(JSON.stringify(historical.resolution)===JSON.stringify(positive.resolutions)&&historical.origins.every((v:number,i:number)=>String(v)===positive.encounters[i]),'historical-source-mismatch');
 const historicalNo=JSON.parse(read('samples/no/H1-uncertainty.json')).cases[0];
 check(JSON.stringify(historicalNo.resolution)==='[1,2,3,4]'&&JSON.stringify(historicalNo.origins)==='[4,1,1,1]'&&historicalNo.expect===4.8,'historical-negative-source-mismatch');
 const proof=JSON.parse(read('vectors/laws/helly-comb.lean.json'));
 check(proof.sourceSha256===sha(read(proof.source))&&proof.events.length===4&&proof.events.every((e:any)=>e.sourceSha256===proof.sourceSha256&&e.exitCode===(e.operation==='positive'?0:1)&&sha(e.stdout)===e.stdoutSha256&&sha(e.stderr)===e.stderrSha256&&!e.stdout.includes('sorryAx')),'lean-capture-identity');
 const no=JSON.parse(read('samples/laws/linage-rest/no.json'));check(no.cases.length===3,'negative-inventory');
 for(const c of no.cases){let why='';try{rejectClaim(c.region,JSON.parse(read('samples/laws/linage-rest/yes.json')));}catch(e){why=String(e);}check(why.includes(c.expectedRefusal),'named-negative-missing');}
 return [{scope,role:'writes' as const,measure:'count',bound:{kind:'interval' as const,lo:0,hi:0}}];
}
type Asked={lines:readonly {scope:string;measure:string;about?:string}[]};
export function receipt(asked:Asked){return inspect(asked.lines.filter(l=>l.measure==='text'&&l.about!==undefined).map(l=>[l.scope,l.about!] as const));}
