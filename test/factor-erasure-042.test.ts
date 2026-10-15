import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../vectors/laws/factor-erasure.json',import.meta.url),'utf8'));
type Event={truth:number;output:string;mass:number};
// Finite-table arithmetic only; aggregate duplicate outcomes before computing I.
function aggregate(events:readonly Event[]):Event[]{
 const cells=new Map<string,Event>();
 for(const event of events){
  const key=JSON.stringify([event.truth,event.output]),held=cells.get(key);
  cells.set(key,{...event,mass:(held?.mass??0)+event.mass});
 }
 return [...cells.values()];
}
function information(events:readonly Event[]):number{
 const joint=aggregate(events),truth=new Map<number,number>(),output=new Map<string,number>();
 for(const e of joint){truth.set(e.truth,(truth.get(e.truth)??0)+e.mass);output.set(e.output,(output.get(e.output)??0)+e.mass);}
 assert.equal([...truth.values()].reduce((a,b)=>a+b,0),1);
 return joint.reduce((sum,e)=>sum+e.mass*Math.log2(e.mass/(truth.get(e.truth)!*output.get(e.output)!)),0);
}
test('factor erasure: identical declared correctness and independent constant activations allow different truth information',()=>{
 assert.deepEqual(data.activationProbabilities,[1,1]);
 // Both activation indicators are constant 1, so P(A1 and A2)=P(A1)P(A2)=1.
 assert.equal(data.activationProbabilities[0]*data.activationProbabilities[1],1);
 const results:number[]=[];
 for(const law of data.laws){
  for(const truth of [0,1]){
   const rows=law.joint.filter((e:{truth:number})=>e.truth===truth);
   assert.equal(rows.reduce((sum:number,e:{mass:number})=>sum+e.mass,0),data.truthMass);
   for(let factor=0;factor<2;factor++){
    const correct=rows.filter((e:{factors:number[]})=>e.factors[factor]===truth).reduce((sum:number,e:{mass:number})=>sum+e.mass,0);
    assert.equal(correct/data.truthMass,data.correctness[factor]);
   }
  }
  const observed:Event[]=law.joint.map((e:{truth:number;factors:number[];mass:number})=>({
   truth:e.truth,output:e.factors[0]===e.factors[1]?String(e.factors[0]):'erasure',mass:e.mass,
  }));
  assert.deepEqual(aggregate(observed),law.observedJoint);
  const bits=information(observed);
  assert.equal(bits,law.informationBits);results.push(bits);
  assert.equal(information(observed.map(e=>({...e,output:String(e.output==='erasure')}))),law.erasureIndicatorInformationBits);
 }
 assert.deepEqual(results,[1,0]);
});
