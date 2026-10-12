export type Rational = Readonly<{numerator:string; denominator:string}>;
export type RationalInput = string | Rational;
export type Q = readonly [bigint,bigint];
export const zero:Q=[0n,1n], one:Q=[1n,1n];
export const refuse=(cause:string):never=>{throw new Error('REFUSE·model/M3 '+cause);};
const gcd=(a:bigint,b:bigint):bigint=>{a=a<0n?-a:a;while(b){const r=a%b;a=b;b=r;}return a;};
export function q(a:bigint,b=1n):Q {
  if(b===0n)refuse('zero rational denominator');
  if(b<0n){a=-a;b=-b;}
  const d=gcd(a,b);return [a/d,b/d];
}
export function rational(input:RationalInput):Q {
  if(typeof input==='string'){
    if(/^-?\d+\/\d+$/.test(input)){const [a,b]=input.split('/');return q(BigInt(a!),BigInt(b!));}
    if(!/^-?\d+(\.\d+)?$/.test(input))refuse('invalid exact probability');
    const sign=input.startsWith('-')?-1n:1n,text=input.replace(/^-/,'');
    const [whole,part='']=text.split('.');return q(sign*BigInt(whole!+part),10n**BigInt(part.length));
  }
  if(!input||typeof input.numerator!=='string'||typeof input.denominator!=='string'||!/^[-]?\d+$/.test(input.numerator)||!/^\d+$/.test(input.denominator))refuse('invalid rational');
  return q(BigInt(input.numerator),BigInt(input.denominator));
}
export const add=(a:Q,b:Q):Q=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
export const sub=(a:Q,b:Q):Q=>q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
export const mul=(a:Q,b:Q):Q=>q(a[0]*b[0],a[1]*b[1]);
export const div=(a:Q,b:Q):Q=>q(a[0]*b[1],a[1]*b[0]);
export const pow=(a:Q,n:number):Q=>q(a[0]**BigInt(n),a[1]**BigInt(n));
export const equal=(a:Q,b:Q):boolean=>a[0]===b[0]&&a[1]===b[1];
export const pack=(a:Q):Rational=>({numerator:String(a[0]),denominator:String(a[1])});
export function probability(input:RationalInput):Q {const a=rational(input);if(a[0]<0n||a[0]>a[1])refuse('probability outside 0..1');return a;}
export function roundHalfEven(input:RationalInput,digits:number):string {
  if(!Number.isSafeInteger(digits)||digits<0)refuse('invalid decimal digits');
  const [a,b]=rational(input),scale=10n**BigInt(digits),absolute=a<0n?-a:a;
  let integer=absolute*scale/b;const remainder=absolute*scale%b;
  if(2n*remainder>b||(2n*remainder===b&&integer%2n===1n))integer++;
  const text=String(integer).padStart(digits+1,'0'),prefix=a<0n&&integer!==0n?'-':'';
  return prefix+(digits?text.slice(0,-digits)+'.'+text.slice(-digits):text);
}
