import {test} from 'node:test';
import assert from 'node:assert/strict';
import {capacityBound,capacityP0,mutualInformation,unanimityNoFactor,decisionInformation} from '../../src/measures/capacity.ts';
const policy={logarithm:'binary64-log2' as const,budget:'100000'};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} versus ${b}`);
test('finite exact joint probabilities reproduce the four captured information vectors',()=>{
  for(const [k,expected] of [[1,.313028978],[2,.469712906],[4,.914458010],[7,1.332321771]]){
    const result=mutualInformation(k!,{n:4,c:'1/5',p:'3/10'},policy);
    assert.equal(result.status,'measured');
    if(result.status==='measured'){
      near(result.value,expected!);assert.deepEqual(result.probabilitySum,{numerator:'1',denominator:'1'});
      const loss=result.loss;
      near(2-result.value,loss.exclusion+loss.privateUncertainty+loss.factorAmbiguity);
    }
  }
  near(capacityBound(4,'1/5',policy).value,1.683007500);
});
test('p=0 is k-invariant; limit statements never overwrite finite or uninformative channels',()=>{
  const expected=capacityP0(4,'1/5',policy).value;near(expected,.961079405);
  for(const k of [1,2,4]){
    const result=mutualInformation(k,{n:4,c:'1/5',p:'0'},policy);
    assert.equal(result.status,'measured');if(result.status==='measured')near(result.value,expected);
  }
  const uniform=mutualInformation(3,{n:4,c:'0',p:'3/4'},policy);
  assert.equal(uniform.status,'measured');if(uniform.status==='measured')near(uniform.value,0);
  const covering=mutualInformation(2,{n:4,c:'1',p:'3/10'},policy);
  assert.equal(covering.status,'measured');if(covering.status==='measured')near(covering.value,Math.log2(4/3));
});
test('the binary all-wrong channel carries a full bit; plurality is not an information bound',()=>{
  const result=decisionInformation(1,{n:2,c:'1/5',p:'1'},'posterior-map-uniform-ties@1',policy);
  assert.equal(result.status,'measured');
  if(result.status==='measured'&&'decision' in result){
    near(result.value,1);near(result.decision.information,1);
    assert.deepEqual(result.decision.accuracy,{numerator:'1',denominator:'1'});
  }
});
test('finite decision accuracy, decision information and posterior information stay separate',()=>{
  const model={n:4,c:'1/5',p:'3/10'},before=JSON.stringify(model);
  const optimal=decisionInformation(4,model,'posterior-map-uniform-ties@1',policy);
  const plurality=decisionInformation(4,model,'plurality-uniform-ties@1',policy);
  assert.equal(optimal.status,'measured');assert.equal(plurality.status,'measured');
  if(optimal.status==='measured'&&plurality.status==='measured'&&'decision' in optimal&&'decision' in plurality){
    assert.ok(optimal.decision.information<=optimal.value+1e-12);
    const a=optimal.decision.accuracy,b=plurality.decision.accuracy;
    assert.ok(BigInt(a.numerator)*BigInt(b.denominator)>=BigInt(b.numerator)*BigInt(a.denominator));
    assert.deepEqual(optimal,decisionInformation(4,model,'posterior-map-uniform-ties@1',policy));
  }
  assert.equal(JSON.stringify(model),before);
});
test('work budgets refuse before exponential evaluation and logs are explicitly declared',()=>{
  assert.equal(mutualInformation(1000000000,{n:64,c:'1/5',p:'1/3'},policy).status,'unmeasured');
  assert.equal(unanimityNoFactor(1000000000,64,'1/3',{budget:'10'}).status,'unmeasured');
  const value=unanimityNoFactor(2,4,'3/10',{budget:'100'});
  assert.equal(value.status,'measured');if(value.status==='measured')assert.deepEqual(value.value,{numerator:'13',denominator:'25'});
  assert.throws(()=>capacityBound(4,'1/5',{} as typeof policy),/policy required/);
  assert.throws(()=>mutualInformation(0,{n:4,c:'1/5',p:'1/3'},policy),/witness count/);
});
