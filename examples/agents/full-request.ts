/**
 * One request, end to end — everything the library does, in the order a real
 * handler does it.
 *
 *   plan ┐
 *   dpa  ├─▶ combine ─▶ bounds ─▶ offer ─▶ agent ─▶ check ─▶ run
 *   bot  ┘                 │
 *                          └─▶ if it contradicts: why, and what to change
 */

import {
  anyOf,
  chain,
  complexity,
  compose,
  entails,
  missing,
  packer,
  state,
  unit,
  weakest,
  type Unit,
} from '../../src/index';

const reach = chain(['none', 'own', 'team', 'region', 'all']);
const pk = packer(reach);
const line = (u: Unit): string => `${u.floor}..${u.ceiling}`;

// 1 · What each source says about `email.send`.
const plan = unit('email.send', { floor: 'none', ceiling: 'region' });
const dpa = unit('email.send', { floor: 'none', ceiling: 'own' });
const rota = unit('email.send', { floor: 'team', ceiling: 'all' });

console.log('1 · the sources');
for (const [who, u] of [
  ['plan', plan],
  ['dpa', dpa],
  ['rota', rota],
] as const) {
  console.log(
    `    ${who.padEnd(6)} ${line(u).padEnd(14)} ${state(reach, u)}  says ${complexity(reach, u)}`,
  );
}

// 2 · Combine what actually applies. The rota is a floor; the DPA a ceiling.
console.log('\n2 · combined');
const applied = compose(reach, [plan, dpa]);
console.log(`    plan + dpa          ${line(applied)}   ${state(reach, applied)}`);
const withRota = compose(reach, [plan, dpa, rota]);
console.log(`    plan + dpa + rota   ${line(withRota)}   ${state(reach, withRota)}`);
console.log(`    stops at            [${pk.clashing(pk.pack(withRota))}]`);

// 3 · What would fix it.
console.log('\n3 · what to change');
console.log('   ', missing(reach, applied, rota));

// 4 · Alternatives: two routes, and the gap between them stays visible.
console.log('\n4 · routes');
const routes = anyOf(reach, [
  unit('lookup', { floor: 'none', ceiling: 'own' }),
  unit('lookup', { floor: 'region', ceiling: 'all' }),
]);
console.log('   ', routes.map(line).join('   '), `(${routes.length} ranges — a gap at team)`);

// 5 · Is one statement stricter than another?
console.log('\n5 · stricter than');
console.log(`    dpa ⊨ plan   ${entails(reach, dpa, plan)}`);
console.log(`    plan ⊨ dpa   ${entails(reach, plan, dpa)}`);

// 6 · And the claim is worth its weakest input.
console.log('\n6 · evidence');
console.log(`    exact + sample + declared → ${weakest(['exact', 'sample', 'declared'])}`);
