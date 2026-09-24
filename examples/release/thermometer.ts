import { disagree, origins, point } from '@lapxo/obligations';
import { steady } from '@lapxo/obligations/views/product';

const said = (cell: ReturnType<typeof point>): string =>
  (origins(cell) < 2 ? 'grey' : disagree(cell) ? 'split' : 'agreed');

const bath = point('bath', 0, [
  { origin: 'a', span: { lo: 19.8, hi: 20.2 } },
  { origin: 'b', span: { lo: 19.9, hi: 20.3 } },
  { origin: 'c', span: { lo: 19.7, hi: 20.1 } },
  { origin: 'd', span: { lo: 24.0, hi: 24.4 } },
]);
const without = (name: string) => point('bath', 0, bath.seen.filter((one) => one.origin !== name));

console.log('four thermometers', said(bath));
for (const one of ['a', 'b', 'c', 'd']) console.log(`without ${one}        `, said(without(one)));
console.log('holds without any one of them:', steady(bath));
console.log('why       leaving one out names the instrument that disagrees, and a verdict that needs every origin is not a verdict');
