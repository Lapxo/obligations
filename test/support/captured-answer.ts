import assert from 'node:assert/strict';

/** Rational records, parameters and decisions stay exact. A binary64-log2
 * result may differ by one adjacent representable value across JS engines. */
export function assertCapturedAnswer(actual:unknown,expected:unknown,logarithm=false,path='$'):void {
  if(typeof actual==='number'&&typeof expected==='number'){
    if(Object.is(actual,expected))return;
    if(!logarithm||!Number.isFinite(actual)||!Number.isFinite(expected)||Number.isInteger(actual)||Number.isInteger(expected))assert.equal(actual,expected,path);
    const bits=(n:number)=>{const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,n);return view.getBigUint64(0);};
    const a=bits(actual),b=bits(expected),distance=a>b?a-b:b-a;
    assert.ok(distance<=1n,`${path}: binary64-log2 distance ${distance} ULP exceeds one`);return;
  }
  if(Array.isArray(actual)&&Array.isArray(expected)){
    assert.equal(actual.length,expected.length,path);for(let i=0;i<actual.length;i++)assertCapturedAnswer(actual[i],expected[i],logarithm,path+'['+i+']');return;
  }
  if(actual!==null&&expected!==null&&typeof actual==='object'&&typeof expected==='object'){
    const a=actual as Record<string,unknown>,e=expected as Record<string,unknown>;
    assert.deepEqual(Object.keys(a).sort(),Object.keys(e).sort(),path);
    const policy=(v:Record<string,unknown>)=>v.logarithm==='binary64-log2'||(v.policy!==null&&typeof v.policy==='object'&&(v.policy as Record<string,unknown>).logarithm==='binary64-log2');
    const numeric=logarithm||(policy(a)&&policy(e));
    for(const key of Object.keys(e))assertCapturedAnswer(a[key],e[key],key==='parameters'?false:numeric,path+'.'+key);return;
  }
  assert.deepEqual(actual,expected,path);
}
