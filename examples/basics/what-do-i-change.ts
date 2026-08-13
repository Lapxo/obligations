/**
 * After a refusal: not "why", but "what would fix it".
 *
 *          none    own    team   region   all
 *   have   ●━━━━━━━━━━━━━━━━●
 *   want   ················●━━━━━━━━━━━━━●
 *   need                    raise the ceiling to `all`
 */

import { chain, missing, unit } from '../../src/index';

const scale = chain(['none', 'own', 'team', 'region', 'all']);
const have = unit('x', { floor: 'none', ceiling: 'team' });

for (const [label, want] of [
  ['ceiling short', unit('x', { floor: 'none', ceiling: 'all' })],
  ['floor short', unit('x', { floor: 'own', ceiling: 'team' })],
  ['both short', unit('x', { floor: 'own', ceiling: 'all' })],
  ['already enough', unit('x', { floor: 'none', ceiling: 'own' })],
] as const) {
  console.log(label.padEnd(16), missing(scale, have, want));
}

// `null` means that side already holds. Apply what it returns and the target
// is reached — nothing else to work out.
