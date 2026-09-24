import { and, chain, fuse, height, idealComplexity, idealJoin, idealMeet, isDistributive, or, order, rebuild, register, unitToIdeal, widen } from '@lapxo/obligations';
import type { Scale, Unit } from '@lapxo/obligations';
import { packer } from '@lapxo/obligations/packed';
import { load } from './vectors-harness.ts';

test('D2-ideal — vectors/measure: what conserves, and where', () => {
  const v = load('measure');

  const scaleOf = (c: { levels: string[]; leq: boolean[][] | null }): Scale =>
    c.leq ? order(c.levels, c.leq) : chain(c.levels);

  for (const k of v.cases) {
    const c = scaleOf(k);
    compare(isDistributive(c), k.distributive, `${k.name}: distributive`);

    const us: Unit[] = [];
    for (const f of c.levels)
      for (const cl of c.levels) us.push({ subject: 's', floor: f, ceiling: cl } as Unit);

    const measures: [string, (u: Unit) => number][] = [
      ['complexity', (u) => idealComplexity(c, unitToIdeal(c, u))],
      ['height', (u) => height(c, c.rank(u.floor)) - height(c, c.rank(u.ceiling))],
    ];
    for (const [nm, w] of measures) {
      let broke = 0;
      for (const a of us)
        for (const b of us) {
          if (nm === 'complexity') {
            const ia = unitToIdeal(c, a);
            const ib = unitToIdeal(c, b);
            if (
              idealComplexity(c, idealMeet(ia, ib)) + idealComplexity(c, idealJoin(ia, ib)) !==
              idealComplexity(c, ia) + idealComplexity(c, ib)
            ) {
              broke++;
            }
          } else {
            const both = fuse(c, [a, b]);
            const either = widen(c, [a, b]);
            if (w(both) + w(either) !== w(a) + w(b)) broke++;
          }
        }
      compare(broke === 0, k.conserves[nm], `${k.name}: ${nm} conserves (${broke} broke)`);
    }
  }

  const ideals = load('ideals');
  compare(Boolean(ideals.cases.some((k: { closed: boolean }) => !k.closed)), true, 'ideals.json has no refused pair — L0 is untested');

  for (const k of v.widen) {
    const c = chain(k.chain);
    const us = k.input.map(
      (x: { floor: string; ceiling: string }) =>
        ({ subject: 's', floor: x.floor, ceiling: x.ceiling }) as Unit,
    );
    const f = fuse(c, us);
    const w = widen(c, us);
    compare(`${f.floor}|${f.ceiling}`, `${k.fuse.floor}|${k.fuse.ceiling}`, `${k.name}: fuse`);
    compare(`${w.floor}|${w.ceiling}`, `${k.widen.floor}|${k.widen.ceiling}`, `${k.name}: widen`);
  }
});

test('packer — the two forms agree on BOTH directions, not just one', () => {
  const agree = (c: Scale, label: string): void => {
    const pk = packer(c);
    const us: Unit[] = [];
    for (const f of c.levels)
      for (const cl of c.levels) us.push({ subject: 's', floor: f, ceiling: cl } as Unit);

    let checked = 0;
    for (const a of us)
      for (const b of us) {
        const narrowUnit = fuse(c, [a, b]);
        const narrowMask = pk.unpack('s', and(pk.pack(a), pk.pack(b)));
        compare(`${narrowMask.floor}|${narrowMask.ceiling}`, `${narrowUnit.floor}|${narrowUnit.ceiling}`, `${label}: and disagrees with fuse`);

        const wideUnit = widen(c, [a, b]);
        const wideMask = pk.unpack('s', or(pk.pack(a), pk.pack(b)));
        compare(`${wideMask.floor}|${wideMask.ceiling}`, `${wideUnit.floor}|${wideUnit.ceiling}`, `${label}: or disagrees with widen`);
        checked++;
      }
    compare(checked, us.length ** 2, `${label}: not every pair was compared`);

    const w = (p: ReturnType<typeof pk.pack>): number => {
      const u = pk.unpack('s', p);
      const r = register(c, u);
      return r.demanded.length + r.limiting.length;
    };
    let broke = 0;
    for (const a of us)
      for (const b of us) {
        const [pa, pb] = [pk.pack(a), pk.pack(b)];
        if (w(and(pa, pb)) + w(or(pa, pb)) !== w(pa) + w(pb)) broke++;
      }
    if (isDistributive(c)) {
      compare(broke, 0, `${label}: the conservation law failed in the fast form`);
    } else {
      compare(broke > 0, true, `${label}: conservation held on a non-distributive scale — then the flag means nothing`);
    }

    for (const u of us) {
      const back = rebuild(c, register(c, u), 's');
      compare(`${back.floor}|${back.ceiling}`, `${u.floor}|${u.ceiling}`, `${label}: rebuild∘register is not the identity at ${u.floor}|${u.ceiling}`);
    }
  };

  agree(chain(['none', 'own', 'team', 'region', 'all']), 'ladder');
  const measured = load('measure');
  for (const k of measured.cases) {
    if (!k.leq) continue;
    agree(order(k.levels, k.leq), k.name);
  }
});
