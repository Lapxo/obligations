/**
 * "Any of these" is a list, not a range.
 *
 *          none    own    team   region   all
 *   a      ●━━━━━━━━●
 *   b      ················●━━━━━━━━━●
 *   anyOf  ●━━━━━━━━●      ●━━━━━━━━━●        two, exactly
 */

import { anyOf, chain, unit } from '../../src/index';

const scale = chain(['none', 'own', 'team', 'region', 'all']);
const show = (us: ReturnType<typeof anyOf>): string =>
  us.map((u) => `${u.floor}..${u.ceiling}`).join('   ') || '(nothing)';

const a = unit('x', { floor: 'none', ceiling: 'own' });
const b = unit('x', { floor: 'region', ceiling: 'all' });

console.log('a gap        ', show(anyOf(scale, [a, b])));
console.log(
  'touching     ',
  show(anyOf(scale, [unit('x', { floor: 'none', ceiling: 'team' }), b])),
);
console.log('nested       ', show(anyOf(scale, [unit('x', { floor: 'none', ceiling: 'all' }), a])));

// A third alternative can bridge two that were apart.
const bridge = unit('x', { floor: 'own', ceiling: 'region' });
console.log('with a bridge', show(anyOf(scale, [a, b, bridge])));

// Unsatisfiable alternatives contribute nothing to "any of these".
console.log('impossible   ', show(anyOf(scale, [unit('x', { floor: 'all', ceiling: 'none' })])));

// One range back means the alternatives really were one. More than one means
// they are genuinely separate, and the list says where the gaps are.
