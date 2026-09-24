import { and, bitLoss, canonical, chain, order, rebuild, register, unit } from '@lapxo/obligations';
import type { Level } from '@lapxo/obligations';
import { packer } from '@lapxo/obligations/packed';
import { complexity } from '@lapxo/obligations/price';
import { b2, load, m3, n5 } from './vectors-harness.ts';

test('prop-halfboolean — vectors/bit-loss: a boolean is exact in two places', () => {
  for (const c of load('bit-loss').cases) {
    const got = bitLoss(chain(c.chain));
    compare(got.possible, c.possible, `${c.name}: possible`);
    compare(got.exactly, c.exactly, `${c.name}: exactly`);
    compare(got.lossy, c.lossy, `${c.name}: lossy`);
    compare(got.unsayable, c.unsayable, `${c.name}: unsayable`);
  }
});

test('thm-decomp — vectors/incidence: both faces, and j ≤ m', () => {
  for (const c of load('incidence').cases) {
    const o = c.chain ? chain(c.chain) : order(c.levels, c.leq);
    compare(o.joins().map((i: Level) => o.levels[i]), c.joins, `${c.name}: joins`);
    compare(o.limits().map((i: Level) => o.levels[i]), c.limits, `${c.name}: limits`);
    const pk = packer(o);
    const joins = o.joins();
    const limits = o.limits();
    for (let bit = 0; bit < joins.length; bit++) {
      const name = o.levels[joins[bit]];
      const got = limits.filter((_, m) => (pk.above(bit) & (1 << m)) !== 0).map((m) => o.levels[m]);
      compare(got, c.above[name], `${c.name}: above ${name}`);
    }
  }
});

test('vectors/coherence: pack is coherent; M3 fuse is not canonical', () => {
  for (const c of load('coherence').cases) {
    const o = c.chain ? chain(c.chain) : order(c.levels, c.leq);
    const pk = packer(o);
    if (c.kind === 'all-packed-coherent') {
      let n = 0;
      for (const floor of o.levels)
        for (const ceiling of o.levels) {
          const p = pk.pack(unit('s', { floor, ceiling }));
          compare(Boolean(pk.coherent(p)), true, `${c.name}: ${floor}/${ceiling}`);
          compare(canonical(pk, p), p, `${c.name}: already canonical`);
          n++;
        }
      compare(n > 4, true);
    } else {
      const fused = and(pk.pack(unit('s', c.left)), pk.pack(unit('s', c.right)));
      const back = pk.unpack('s', fused);
      compare(back.floor, c.unpacked_floor, `${c.name}: unpack`);
      const closed = canonical(pk, fused);
      compare(closed.demanded !== fused.demanded, true, `${c.name}: still canonical`);
      compare(!pk.coherent(fused), true, `${c.name}: fuse was coherent`);
      const added = o.joins().filter((_, bit) => (closed.demanded & ~fused.demanded & (1 << bit)) !== 0);
      compare(added.map((j) => o.levels[j]), [c.canonical_adds], `${c.name}: closure`);
    }
  }
});

test('vectors/register: rebuild ∘ register is the identity', () => {
  const v = load('register');
  const ch = chain(v.chain);
  for (const c of v.cases) {
    if (c.kind === 'n5' || c.kind === 'm3') {
      const o = c.kind === 'n5' ? n5() : m3();
      const u = unit('s', { floor: c.floor, ceiling: c.ceiling });
      const back = rebuild(o, register(o, u), 's');
      compare(back, u, c.name);
      continue;
    }
    const u = unit('s', { floor: c.floor, ceiling: c.ceiling });
    const r = register(ch, u);
    compare(r.demanded, c.demanded, `${c.name}: demanded`);
    compare(r.limiting, c.limiting, `${c.name}: limiting`);
    compare(complexity(ch, u), c.complexity, `${c.name}: complexity`);
    compare(rebuild(ch, r, 's'), u, `${c.name}: rebuild`);
  }

  for (const o of [ch, b2(), n5(), m3()]) {
    for (const floor of o.levels)
      for (const ceiling of o.levels) {
        const u = unit('s', { floor, ceiling });
        compare(rebuild(o, register(o, u), 's'), u, `${o.levels.join('/')}: ${floor}/${ceiling}`);
      }
  }
});
