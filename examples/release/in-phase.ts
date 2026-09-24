import { coherence, interfere } from '@lapxo/obligations/views/field';

const span = { lo: 0, hi: 0 };
let held = 11;
const next = (): number => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
const together = Array.from({ length: 32 }, (_, i) => ({ origin: `o${i}`, epoch: 8, span }));
const strewn = Array.from({ length: 32 }, (_, i) => ({ origin: `o${i}`, epoch: Math.floor(next() * 8), span }));

console.log('in phase  ', interfere(together, 8), 'coherence', coherence(together, 8).toFixed(2));
console.log('strewn    ', interfere(strewn, 8).toFixed(0), 'coherence', coherence(strewn, 8).toFixed(2));
console.log('their number is 32, and its square is', 32 ** 2);
console.log('why       claims that land at one turn of the period add as the square of their number, and the same claims strewn across it add as its order');
