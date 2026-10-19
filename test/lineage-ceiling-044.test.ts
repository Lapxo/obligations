import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate} from './support/lineage-reader.ts';

const yes=JSON.parse(readFileSync(new URL('../samples/laws/lineage-ceiling/yes.json',import.meta.url),'utf8'));
const no=JSON.parse(readFileSync(new URL('../samples/laws/lineage-ceiling/no.json',import.meta.url),'utf8'));
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-12);

test('lineage: missing Markov channel refuses; the old general model is a counterexample',()=>{
  assert.throws(()=>evaluate(no),/REFUSE·lineage markov-model-required/);
  const result=evaluate(yes);
  near(result.counterexamples.withoutMarkov.information,0.007225546012191497);
  near(result.counterexamples.withoutMarkov.misappliedCeiling,0);
  near(result.counterexamples.withoutSymmetry.information,0.31127812445913294);
  near(result.counterexamples.withoutSymmetry.misappliedCeiling,0.18872187554086706);
  near(result.counterexamples.revealedIndicator.information,1);
});

test('lineage: revealing the cause or adding truth access is outside the conditional contract',()=>{
  for(const field of ['extraTruthAccess','revealedCauseIndicator']){
    assert.throws(()=>evaluate({...yes,conditions:{...yes.conditions,[field]:true}}),/REFUSE·lineage declared-channel-required/);
  }
});

test('lineage: exact finite composition approaches its ceiling; F1 concerns another quantity',()=>{
  const result=evaluate(yes);
  const binary=result.approach[0];
  near(binary.ceiling,0.2780719051126378);
  near(binary.rows[0].information,0.09561854227550581);
  near(binary.rows.at(-1).information,0.25518764242313363);
  assert.ok(binary.rows.at(-1).gap<binary.rows[0].gap);
  assert.equal(result.asymptoticLimitVerified,false);
  near(result.f1.residual,0.5);
  near(result.f1.binaryF1Bound,0);
  near(result.f1.binaryNoiselessTruthInformation,1);
  near(result.f1.independentTruthInformation,0);
});
