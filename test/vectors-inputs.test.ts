import { anyOf, chain, missing, state, unit } from '@lapxo/obligations';
import type { Level, Unit } from '@lapxo/obligations';
import { packer } from '@lapxo/obligations/packed';
import { caught, load, scaleFrom } from './vectors-harness.ts';

test('chain — degenerate carriers', () => {
  const v = load('degenerate');
  for (const c of v.cases) {
    const threw = caught(() => chain(c.levels));
    if (c.expect === 'OK') {
      compare(threw, null, `${c.name}: refused a valid scale`);
      const o = chain(c.levels);
      compare(o.bottom, c.bottom, `${c.name}: bottom`);
      compare(o.top, c.top, `${c.name}: top`);
      compare(o.joins().map((j: Level) => o.levels[j]), c.debits, `${c.name}: demand-debits`);
      const u = unit('s', { floor: o.bottom, ceiling: o.top });
      compare(state(o, u), c.state, `${c.name}: state`);
      const pk = packer(o);
      compare(pk.unpack('s', pk.pack(u)), u, `${c.name}: round trip`);
    } else {
      compare(threw?.code, c.expect, c.name);
    }
  }
});

test('packer — may this happen at this level', () => {
  const v = load('accepts');
  const o = chain(v.chain);
  const pk = packer(o);
  let yes = 0;
  let no = 0;
  for (const c of v.cases) {
    const u = unit('s', { floor: c.floor, ceiling: c.ceiling });
    compare(pk.accepts(pk.pack(u), pk.maskOf(c.at)), c.accepts, c.name);
    if (c.accepts) yes++;
    else no++;
  }
  compare(yes > 0 && no > 0, true, 'the file only tests one answer');
  for (const floor of v.walked ? o.levels : []) {
    for (const ceiling of o.levels) {
      const u = unit('s', { floor, ceiling });
      for (let l = 0; l < o.levels.length; l++) {
        const walked = o.leq(o.rank(floor), l) && o.leq(l, o.rank(ceiling));
        compare(pk.accepts(pk.pack(u), pk.maskOf(o.levels[l]!)), walked, `${v.walked}: ${floor}/${ceiling} at ${o.levels[l]}`);
      }
    }
  }
});

test('anyOf — exact, as a list', () => {
  const v = load('any-of');
  const o = chain(v.chain);
  let merged = 0;
  let apart = 0;
  for (const c of v.cases) {
    const got = anyOf(
      o,
      c.units.map((u: { floor: string; ceiling: string }) => unit('s', u)),
    );
    compare(got.map((u: Unit) => ({ floor: u.floor, ceiling: u.ceiling })), c.anyOf, c.name);
    if (c.units.length > got.length) merged++;
    if (got.length > 1) apart++;
  }
  compare(merged > 0 && apart > 0, true, 'only one kind of answer was exercised');
  const kept = v.preserves;
  if (kept) {
    const c = chain(kept.chain);
    const all: Unit[] = c.levels.flatMap((floor: string, f: number) => c.levels.slice(f).map((ceiling: string) => unit('s', { floor, ceiling })));
    const accepts = (u: Unit, l: number): boolean => c.leq(c.rank(u.floor), l) && c.leq(l, c.rank(u.ceiling));
    let checked = 0;
    for (let mask = 1; mask < 1 << all.length; mask += kept.step) {
      const picked = all.filter((_, i) => mask & (1 << i));
      const got = anyOf(c, picked);
      for (let l = 0; l < c.levels.length; l++) {
        compare(got.some((u) => accepts(u, l)), picked.some((u) => accepts(u, l)), `${kept.about}: level ${c.levels[l]}`);
      }
      checked++;
    }
    compare(checked, Math.ceil(((1 << all.length) - 1) / kept.step), 'not every stepped subset was checked');
  }
});

test('missing — what to change, and applying it reaches the target', () => {
  const v = load('missing');
  const o = chain(v.chain);
  const u = (x: { floor: string; ceiling: string }): Unit => unit('s', x);
  for (const c of v.cases) {
    const got = missing(o, u(c.have), u(c.want));
    compare(got.raiseFloorTo, c.raiseFloorTo, `${c.name}: floor`);
    compare(got.raiseCeilingTo, c.raiseCeilingTo, `${c.name}: ceiling`);

    const fixed = unit('s', {
      floor: got.raiseFloorTo[0] ?? c.have.floor,
      ceiling: got.raiseCeilingTo[0] ?? c.have.ceiling,
    });
    compare(Boolean(o.leq(o.rank(c.want.floor), o.rank(fixed.floor))), true, `${c.name}: still short`);
    compare(Boolean(o.leq(o.rank(c.want.ceiling), o.rank(fixed.ceiling))), true, `${c.name}: still short`);
  }
  const side = v.sideBySide;
  if (side) {
    const s = scaleFrom(side.scale);
    const m = missing(s, u(side.have), u(side.want));
    compare([m.raiseFloorTo, m.raiseCeilingTo], [side.raiseFloorTo, side.raiseCeilingTo], side.about);
    const reaches = (l: string): boolean => s.leq(s.rank(side.want.floor), s.higher(s.rank(side.have.floor), s.rank(l)));
    for (const l of m.raiseFloorTo) compare(Boolean(reaches(l)), true, `${l} does not reach`);
    for (const l of s.levels) {
      const weaker = m.raiseFloorTo.some((a: string) => a !== l && s.leq(s.rank(l), s.rank(a)));
      compare(!(reaches(l) && weaker), true, `${l} was weaker and still worked`);
    }
  }
});
