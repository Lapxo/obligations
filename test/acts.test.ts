import { intervals } from '@lapxo/obligations/forms';
import { cell, join, mark, meet, observe, parts, require, restOf, sign, state } from '@lapxo/obligations/views/field';
import type { World } from '@lapxo/obligations/views/field';
import { caught, descriptors, load, sample } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

type Band = { readonly lo: number; readonly hi: number };
type Refused = (act: string, field: Readonly<Record<string, string>>, world: World<Band>) => boolean;
const SPAN = intervals(-1000, 1000);
const [LOW, HIGH] = [SPAN.top.lo, SPAN.top.hi];
const resting = cell<Band>('r', 0, [{ id: 'a', origin: 'a', span: { lo: 10, hi: 90 } }, { id: 'b', origin: 'b', span: { lo: 20, hi: 80 } }], ['bound']);

/**
 * What an act's descriptor forces, each read off one of its fields and run against the object: a widening must not
 * travel, a floor required past a signed ceiling is a conflict, a line taken back at −1 must move the pole back, and a
 * travelling act must refuse an order of rest that returns to itself.
 */
const FORCED: readonly (readonly [string, (field: Readonly<Record<string, string>>) => boolean, Refused])[] = [
  ['a widen that travels', (d) => d['sense'] === 'widen',
    (_, d, world) => caught(() => mark({ pole: d['pole'] as 'ceiling', reach: 'travels', span: SPAN.top, widens: 'someone' }))?.code === 'widening-travels'
      && meet(SPAN, resting, world).hi === meet(SPAN, resting, new Map([...world, ['bound', join(SPAN, world.get('bound') ?? cell<Band>('bound'), { lo: LOW, hi: HIGH }, 'someone')]])).hi],
  ['a floor required past a signed ceiling', (d) => d['pole'] === 'floor' && d['reach'] === 'travels',
    (_, __, world) => state(SPAN, resting, require(SPAN, sign(SPAN, world, 'bound', { lo: LOW, hi: 40 }), 'bound', { lo: 60, hi: HIGH })) === 'CONFLICT'],
  ['a withdrawal that leaves the pole where the claim put it', (d) => d['sign']?.split('|').includes('-1') === true,
    (_, __, world) => {
      const raised = observe(resting, { id: 'c', origin: 'c', span: { lo: 50, hi: 70 } });
      const back = observe(raised, { id: 'c', origin: 'c', span: { lo: 50, hi: 70 } }, -1);
      return parts(SPAN, raised, world).floor.lo !== parts(SPAN, resting, world).floor.lo && parts(SPAN, back, world).floor.lo === parts(SPAN, resting, world).floor.lo;
    }],
  ['a rest cycle', (d) => d['reach'] === 'travels',
    (_, __, world) => {
      const loop: World<Band> = new Map([...world, ['bound', { ...(world.get('bound') ?? cell<Band>('bound')), restsOn: ['r'] }], ['r', resting]]);
      return caught(() => restOf(resting, loop))?.code === 'rest-cycle';
    }],
];

const derive = (told: ReadonlyMap<string, Readonly<Record<string, string>>>, world: World<Band>): { readonly derived: readonly string[]; readonly refused: readonly string[] } => {
  const derived: string[] = [];
  const refused: string[] = [];
  for (const [act, field] of told) {
    for (const [name, applies, refuses] of FORCED) {
      if (!applies(field)) continue;
      derived.push(`${act}: ${name}`);
      if (refuses(act, field, world)) refused.push(`${act}: ${name}`);
    }
  }
  return { derived, refused };
};

test('D11-the-obligatory — the falsifiers each act\'s descriptor derives are all refused: no widen travels, no floor passes a signed ceiling, no withdrawal leaves its pole, no rest cycle folds', () => {
  const c = (sample('yes', 'obligatory').cases as Vector[])[8]!;
  const told = descriptors();
  compare([...told.keys()].sort(), c['acts'], 'every act of the object carries a descriptor');
  const { derived, refused } = derive(told, sign(SPAN, new Map(), 'bound', { lo: LOW, hi: 95 }));
  compare(derived, c['derived'], 'what the descriptors derive, act by act');
  compare(refused, derived, 'and each derived falsifier is refused');
});

test('NEGATIVE CONTROL: D11-the-obligatory — a floor required under the signed ceiling is no conflict, and withdrawing a claim that never moved the floor moves nothing', () => {
  const c = (sample('yes', 'obligatory').cases as Vector[])[8]!;
  const world = sign(SPAN, new Map(), 'bound', { lo: LOW, hi: 95 });
  const under = state(SPAN, resting, require(SPAN, world, 'bound', { lo: 30, hi: HIGH })) === 'CONFLICT';
  const idle = observe(resting, { id: 'c', origin: 'c', span: { lo: 0, hi: 100 } });
  const moved = parts(SPAN, idle, world).floor.lo !== parts(SPAN, resting, world).floor.lo;
  compare([under, moved], c['control'], 'the derived checks answer no where their falsifier is absent');
});

test('D11-the-obligatory — every act moves the four states as the moves vector says: CONFLICT is reached locally and by signature', () => {
  const v = load('moves');
  const band = (pair: readonly number[]): Band => ({ lo: pair[0]!, hi: pair[1]! });
  for (const one of v.cases as Vector[]) {
    const claims = (one['claims'] as number[][]).map((span, i) => ({ id: `k${i}`, origin: `o${i}`, span: band(span) }));
    let world: World<Band> = new Map();
    if (one['signed']) world = sign(SPAN, world, 'bound', band(one['signed']), { at: 1 });
    if (one['required']) world = require(SPAN, world, 'bound', band(one['required']), { at: 1 });
    const before = cell<Band>('m', 0, claims, ['bound']);
    const acted = one['act'] === 'observe' ? { c: observe(before, { id: 'n', origin: 'n', span: band(one['span']) }), w: world }
      : one['act'] === 'withdraw' ? { c: observe(before, claims[claims.length - 1]!, -1), w: world }
      : one['act'] === 'sign' ? { c: before, w: sign(SPAN, world, 'bound', band(one['span']), { at: 2 }) }
      : one['act'] === 'require' ? { c: before, w: require(SPAN, world, 'bound', band(one['span']), { at: 2 }) }
      : { c: join(SPAN, before, band(one['span']), 'the owner of m', 2), w: world };
    compare([state(SPAN, before, world), state(SPAN, acted.c, acted.w)], (one['epochs'] as Vector[]).map((epoch) => epoch['state']), one['case'] as string);
  }
});
