/**
 * Your existing table is already valid input.
 *
 *   true   ≡  (bottom, top)      FREE
 *   false  ≡  (bottom, bottom)   FORBIDDEN
 *
 * Enrich the rows that pay for it; leave the rest.
 */

import { asBoolean, chain, permitAll, permitNone, state, unit } from '../../src/index';

const detail = chain(['none', 'own', 'team', 'all']);
const existing = { 'orders.read': true, 'billing.write': false };

for (const [name, v] of Object.entries(existing)) {
  const u = v ? permitAll(detail, name) : permitNone(detail, name);
  console.log(name.padEnd(15), v, '→', state(detail, u));
}

// What the boolean was hiding, in the two states it cannot say.
//
//              none   own   team   all
//   ceiling    ●━━━━━━━━━━━━━●            "up to team"  → true, how far LOST
//   floor      ·············●━━━━━━●      "at least team" → true, the need LOST
for (const u of [
  unit('x', { floor: 'none', ceiling: 'team' }),
  unit('x', { floor: 'team', ceiling: 'all' }),
]) {
  const view = asBoolean(detail, u);
  console.log(`(${u.floor}, ${u.ceiling})`.padEnd(15), state(detail, u).padEnd(10), view);
}
