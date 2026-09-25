import { intervals } from '@lapxo/obligations/forms';
import { cell, meet, sign } from '@lapxo/obligations/views/field';

const scale = intervals(0, 100);
const world = [0, 1, 2, 3].map((i) => cell(`c${i}`, 0, [{ origin: `own${i}`, span: { lo: 20 * i, hi: 100 } }], ['ceiling']));
const before = new Map([['ceiling', cell<{ lo: number; hi: number }>('ceiling')]]);
const after = sign(scale, before, 'ceiling', { lo: 0, hi: 45 });

console.log('cells resting on the ceiling', world.filter((one) => one.restsOn.includes('ceiling')).length);
for (const [i, one] of world.entries()) {
  console.log(`c${i} before`, JSON.stringify(meet(scale, one, before)), '· after', JSON.stringify(meet(scale, one, after)));
}
console.log('claims edited by the signature', world.flatMap((one) => one.seen).filter((claim) => claim.span.hi !== 100).length);
console.log('why       one signature narrows a bound and every cell resting on it reads the narrower one, without touching a single claim any origin made');
