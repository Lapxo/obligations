import { chain, compose, fuse } from '@lapxo/obligations';
import type { Unit } from '@lapxo/obligations';
import { load, throws } from './vectors-harness.ts';

test('A0-carrier — vectors/closure: combining accepts its own output', () => {
  const v = load('closure');
  const c = chain(v.scale);
  const mk = (x: { floor: string; ceiling: string }): Unit =>
    ({ subject: 's', floor: x.floor, ceiling: x.ceiling }) as Unit;

  const laws = new Set<string>();
  for (const k of v.cases) {
    laws.add(k.law);
    const us = k.input.map(mk);

    const got = fuse(c, us);
    compare(got.floor, k.fuse.floor, `${k.name}: fuse floor`);
    compare(got.ceiling, k.fuse.ceiling, `${k.name}: fuse ceiling`);

    if (k.compose === 'MALFORMED') {
      compare(throws(() => compose(c, us), (e: unknown) => (e as { code?: string } | null)?.code === 'MALFORMED'), true, `${k.name}: compose must refuse a statement impossible on its own`);
    } else {
      const cg = compose(c, us);
      compare(cg.floor, k.compose.floor, `${k.name}: compose floor`);
      compare(cg.ceiling, k.compose.ceiling, `${k.name}: compose ceiling`);
    }
  }
  compare(laws.size, v.properties, 'a property in the file was not exercised');

  const every: Unit[] = [];
  for (const f of v.scale) for (const cl of v.scale) every.push(mk({ floor: f, ceiling: cl }));
  const key = (u: Unit): string => `${u.floor}|${u.ceiling}`;
  const neutral = fuse(c, []);

  let crossedFused = 0;
  for (const a of every) {
    compare(key(fuse(c, [a, a])), key(a), 'idempotent');
    compare(key(fuse(c, [a, neutral])), key(a), 'neutral');
    for (const b of every) {
      const ab = fuse(c, [a, b]);
      compare(key(ab), key(fuse(c, [b, a])), 'commutative');
      if (!c.leq(c.rank(ab.floor), c.rank(ab.ceiling))) crossedFused++;
      for (const d of every.slice(0, 5)) {
        compare(key(fuse(c, [ab, d])), key(fuse(c, [a, fuse(c, [b, d])])), 'associative');
      }
    }
  }
  compare(crossedFused > 0, true, 'no crossed result was ever produced, so closure was never tested');
});
