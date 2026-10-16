import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phaseDefect,phaseDefectExtrema} from '../../src/measures/phase-defect.ts';

const vector=JSON.parse(readFileSync(new URL('../../vectors/laws/l8-phase-defect.json',import.meta.url),'utf8'));
const sample=JSON.parse(readFileSync(new URL('../../samples/measures/l8-phase-defect.json',import.meta.url),'utf8'));
const policy={logarithm:'binary64-log2' as const},tolerance=vector.numeric.absoluteTolerance;
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
const error=(expected:string)=>(cause:unknown)=>cause instanceof Error&&cause.message===expected;

test('L8 fixed numerical controls distinguish odd minimum, negative defect and zero-shift maximum',()=>{
  for(const {n,p,s,expected} of vector.cases)near(phaseDefect(n,p,s,policy).value,expected);
  const odd=phaseDefectExtrema(3,3,policy);
  assert.ok(odd.minimum.value>-1);
  assert.deepEqual(odd.minimum.shifts,[1,2]);
  assert.equal(phaseDefect(4,4,2,policy).value,-1);
  assert.ok(phaseDefect(8,4,1,policy).value>0);
  assert.deepEqual(phaseDefectExtrema(3,1,policy).minimum.shifts,[0]);
  assert.equal(phaseDefectExtrema(3,1,policy).nonzeroMaximum,null);
  assert.deepEqual(phaseDefectExtrema(4,2,policy).nonzeroMaximum?.shifts,[1]);
});

test('L8 exhaustively checks the handed finite domain, including degeneracies and symmetry',()=>{
  let divisorPairs=0,shifts=0,nonzeroShifts=0;
  for(let n=vector.enumeration.nMinimum;n<=vector.enumeration.nMaximum;n++){
    for(let p=1;p<=n;p++){
      if(n%p!==0)continue;
      divisorPairs++;
      const values=Array.from({length:p},(_,s)=>phaseDefect(n,p,s,policy).value);
      const extrema=phaseDefectExtrema(n,p,policy),minimum=Math.min(...values),maximum=Math.max(...values);
      near(extrema.minimum.value,minimum);near(extrema.maximum.value,maximum);
      assert.deepEqual(extrema.minimum.shifts,values.flatMap((v,s)=>Math.abs(v-minimum)<=tolerance?[s]:[]));
      assert.deepEqual(extrema.maximum.shifts,values.flatMap((v,s)=>Math.abs(v-maximum)<=tolerance?[s]:[]));
      if(p===1)assert.equal(extrema.nonzeroMaximum,null);
      else {
        const nonzeroMax=Math.max(...values.slice(1));
        near(extrema.nonzeroMaximum!.value,nonzeroMax);
        assert.deepEqual(extrema.nonzeroMaximum!.shifts,values.flatMap((v,s)=>s>0&&Math.abs(v-nonzeroMax)<=tolerance?[s]:[]));
      }
      if(p%2===0)near(minimum,Math.log2(n/p)-1);
      else assert.ok(minimum>Math.log2(n/p)-1);
      for(let s=0;s<p;s++){
        shifts++;
        if(s>0){nonzeroShifts++;near(values[s]!,values[p-s]!);}
        if(n>=2*p)assert.ok(values[s]!>=-tolerance);
      }
    }
  }
  assert.deepEqual({divisorPairs,shifts,nonzeroShifts},{divisorPairs:277,shifts:3399,nonzeroShifts:3122});
  assert.equal(divisorPairs,vector.enumeration.divisorPairs);
  assert.equal(shifts,vector.enumeration.shifts);
  assert.equal(nonzeroShifts,vector.enumeration.nonzeroShifts);
});

test('L8 refuses invalid domains and information interpretations by name',()=>{
  for(const {input,expectedRefusal} of vector.invalid)
    assert.throws(()=>phaseDefect(input[0],input[1],input[2],policy),error(expectedRefusal));
  const yes=sample.yes,no=sample.no;
  near(phaseDefect(yes.n,yes.p,yes.s,yes.policy,yes.interpretation).value,yes.expected);
  assert.throws(()=>phaseDefect(no.n,no.p,no.s,no.policy,no.interpretation),error(no.expectedRefusal));
  // A nonnegative number is not a mutual-information certificate either.
  assert.throws(()=>phaseDefect(8,4,1,policy,'information'),error(no.expectedRefusal));
  assert.throws(()=>phaseDefect(8,4,1,{logarithm:'exact'} as never),error('REFUSE·phase-defect logarithm policy required'));
});
