import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cofailurePairs} from '../../src/measures/cofailure-pairs.ts';
import {evaluate,fixture} from '../support/cofailure-reader.ts';
const sample=JSON.parse(readFileSync(new URL('../../samples/laws/cofailure-pairs/yes.json',import.meta.url),'utf8'));
const data=fixture(sample,sample.separated);
const model={variant:'categorical-match-excess' as const,origins:sample.origins,values:sample.values,
  T:400,theta:'0',budget:sample.budget,reference:sample.handedCategoricalReference};

test('cofailure: oracle and no-truth quantities differ; truth changes cannot identify the oracle-free interpretation',()=>{
  const result=evaluate(sample);
  assert.deepEqual(result.oracle.components,[['a','b'],['c','d']]);
  assert.deepEqual(result.observational.components,[['a','b'],['c','d']]);
  assert.deepEqual(result.oracle.pairs[0]!.observed,{numerator:'1',denominator:'2'});
  assert.deepEqual(result.observational.pairs[0]!.excess,{numerator:'1',denominator:'2'});
  assert.deepEqual(result.counterexamples.sameReportsDifferentTruth.otherOracle.components,[['a'],['b'],['c','d']]);
  assert.equal(result.boundaries.publishedCoincidenceWithoutTruth.status,'unmeasured');
  assert.equal(result.counterexamples.sharedQuestion.oracle.pairs[0]!.observed.numerator,'0');
  assert.equal(result.counterexamples.sharedQuestion.observational.pairs[0]!.excess.numerator,'1');
});

test('cofailure: means do not supply a uniform gap; finite c=e batch keeps trivial uncertainty visible',()=>{
  const result=evaluate(sample),bad=result.counterexamples.betweenMeans;
  assert.deepEqual(bad.gap.meanInside,{numerator:'1',denominator:'2'});
  assert.deepEqual(bad.gap.meanOutside,{numerator:'21',denominator:'200'});
  assert.deepEqual(bad.gap.maxOutside,{numerator:'21',denominator:'100'});
  assert.deepEqual(bad.gap.minInside,{numerator:'1',denominator:'5'});
  assert.equal(bad.gap.strictPopulationGapForHandedTable,false);
  assert.equal(bad.reading.components.length,1);
  const finite=result.counterexamples.finiteCEqualsE;
  assert.deepEqual(finite.allCorrectPerCell,{numerator:'243',denominator:'1024'});
  assert.equal((finite.reading.uncertainty as any).confidence.trivial,true);
  assert.equal((finite.reading.uncertainty as any).conditionalGraphCertificate,false);
  assert.deepEqual((result.oracle.uncertainty as any).confidence.value,{numerator:'19',denominator:'25'});
  assert.deepEqual((result.observational.uncertainty as any).confidence.value,{numerator:'47',denominator:'50'});
});

test('cofailure: parameters, null, complete frame, and sampling are explicit; duplicate delivery adds no evidence',()=>{
  const result=cofailurePairs(data.rows,model);
  assert.deepEqual(cofailurePairs([...data.rows,...data.rows].reverse(),model),result);
  for(const field of ['T','theta'])assert.equal(cofailurePairs(data.rows,{...model,[field]:undefined}).status,'unmeasured');
  assert.equal(cofailurePairs(data.rows,{...model,reference:undefined}).status,'unmeasured');
  assert.equal(cofailurePairs(data.rows.slice(1),model).status,'unmeasured');
  assert.equal(cofailurePairs(data.rows,{...model,budget:'0'}).status,'unmeasured');
  assert.throws(()=>cofailurePairs([...data.rows,{event:'e0',origin:'a',value:'0'}],model),/REFUSE·cofailure conflicting-value e0\/a/);
  assert.throws(()=>cofailurePairs(data.rows,{...model,truth:data.truth} as any),/REFUSE·cofailure non-oracle-truth-input/);
  const bad=structuredClone(model);bad.reference.marginals[0].probabilities[0].p='1/3';
  assert.throws(()=>cofailurePairs(data.rows,bad),/REFUSE·cofailure reference-not-normalized/);
  assert.throws(()=>cofailurePairs(data.rows,{...model,reference:{model:'independent-categorical@1',marginals:[null,null,null,null]}} as any),/REFUSE·cofailure reference-origins-or-values/);
  if(result.status==='measured')assert.equal((result.uncertainty as any).status,'unmeasured');
});
