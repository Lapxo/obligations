import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate,observe} from '../support/measures-reader.ts';

const bytes=(value:unknown)=>new TextEncoder().encode(JSON.stringify(value));
const load=(path:string)=>JSON.parse(readFileSync(new URL('../../samples/measures/'+path,import.meta.url),'utf8'));
const states=['FREE','REQUIRED','FORBIDDEN','CONFLICT'];

test('maintained reader consumes declared q and refuses missing q without supplying a model',()=>{
  const sample=load('t12/common-cause.json');
  const answer=JSON.parse(observe(bytes(sample.yes))[0]!.bound.values[0]!);
  assert.equal(answer.result.model,'single-covering-symmetric-cause@1');
  assert.equal(answer.result.value,sample.yes.expectedBits);
  assert.deepEqual(answer.result.parameters.q,{numerator:'1',denominator:'2'});
  assert.deepEqual(answer.states,states);
  assert.throws(()=>observe(bytes(sample.no)),/REFUSE·capacity common-cause accuracy q required/);
});

test('maintained reader retains declared failure references and handles their sum at or above one',()=>{
  const sample=load('confidence/union-bound.json');
  const answer=JSON.parse(observe(bytes(sample.yes))[0]!.bound.values[0]!);
  assert.deepEqual(answer.result.value,sample.yes.expectedLowerBound);
  assert.deepEqual(answer.result.declarations.map((f:{justification:string})=>f.justification),['hypothesis:A','hypothesis:B']);
  assert.deepEqual(answer.states,states);
  assert.throws(()=>observe(bytes(sample.no)),/REFUSE·confidence justification reference required/);
  const trivial=JSON.parse(observe(bytes(sample.trivial))[0]!.bound.values[0]!);
  assert.deepEqual(trivial.result.value,sample.trivial.expectedLowerBound);
  assert.equal(trivial.result.trivial,true);
  const equal=JSON.parse(observe(bytes({...sample.trivial,failures:[{id:'A',p:'1',justification:'hypothesis:A'}]}))[0]!.bound.values[0]!);
  assert.deepEqual(equal.result.value,{numerator:'0',denominator:'1'});
  assert.equal(equal.result.trivial,true);
});

test('new dispatches preserve the existing capacity and M/3 captures as source readings',()=>{
  for(const group of ['capacity','m3']){
    const pairs=load(group+'.json');
    for(const pair of pairs){
      const value=JSON.parse(observe(bytes(pair.yes))[0]!.bound.values[0]!);
      assert.deepEqual(value,JSON.parse(JSON.stringify(evaluate(pair.yes))));
      assert.deepEqual(value.states,states);
      assert.throws(()=>observe(bytes(pair.no)),/REFUSE/);
    }
  }
});
