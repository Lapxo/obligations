import {add, equal, pack, rational, sub, zero, type Q, type RationalInput} from './rational.ts';

export type RegionMeasure = Readonly<{
  model: 'finite-nonnegative-atomic-valuation@1';
  unit: string;
  atoms: readonly Readonly<{id: string; value: RationalInput}>[];
  regions: readonly Readonly<{id: string; members: readonly string[]}>[];
}>;
const refuse = (cause: string): never => {throw Error('REFUSE·region-measure/' + cause);};
const name = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && !/[\u0000-\u001f\u007f]/.test(x);

/** Exact finite valuation on declared support. No selector discovery,
 * measurement of external events, lattice withdrawal or authority decision. */
export function finiteRegionMeasure(input: RegionMeasure, policy: Readonly<{budget: string}>) {
  if (!input || input.model !== 'finite-nonnegative-atomic-valuation@1' || !name(input.unit)) return refuse('model-and-unit');
  if (Object.keys(input).some(k => !['model','unit','atoms','regions'].includes(k))) return refuse('domain');
  if (!Array.isArray(input.atoms) || !Array.isArray(input.regions)) return refuse('domain');
  if (!policy || typeof policy.budget !== 'string' || !/^(0|[1-9][0-9]*)$/.test(policy.budget)) return refuse('budget');
  let required = BigInt(input.atoms.length) + BigInt(input.regions.length);
  for (const region of input.regions) {
    if (!region || !name(region.id) || !Array.isArray(region.members) || !region.members.every(name) || Object.keys(region).some(k => !['id','members'].includes(k))) return refuse('region');
    required += BigInt(region.members.length);
  }
  // Declared rows visited, not a bound on parsing, sorting, rational bit work
  // or process lifetime. The host enforces its own resource policy.
  if (required > BigInt(policy.budget)) return {status: 'unmeasured' as const, cause: 'region-measure/budget' as const, required: String(required), workUnit: 'declared-input-rows' as const};
  const atoms = new Map<string, Q>();
  for (const atom of input.atoms) {
    if (!atom || !name(atom.id) || Object.keys(atom).some(k => !['id','value'].includes(k))) return refuse('atom');
    let value: Q;
    try {value = rational(atom.value);} catch {return refuse('weight');}
    if (value[0] < 0n) return refuse('negative-weight');
    const held = atoms.get(atom.id);
    if (held !== undefined && !equal(held, value)) return refuse('conflicting-atom');
    atoms.set(atom.id, value);
  }
  const regions = new Set<string>(), membership = new Map<string, string[]>();
  const sum = (ids: readonly string[]): Q => ids.reduce((total, id) => add(total, atoms.get(id)!), zero);
  const readings = input.regions.map(region => {
    if (regions.has(region.id)) return refuse('duplicate-region');
    regions.add(region.id);
    const members = [...new Set<string>(region.members)].sort();
    for (const id of members) {
      if (!name(id) || !atoms.has(id)) return refuse('unknown-atom');
      const holders = membership.get(id) ?? [];
      holders.push(region.id); membership.set(id, holders);
    }
    return {region: region.id, members, value: pack(sum(members))};
  }).sort((a, b) => a.region < b.region ? -1 : a.region > b.region ? 1 : 0);
  const union = [...membership.keys()].sort(), total = sum(union);
  const regionSum = readings.reduce((acc, row) => add(acc, rational(row.value)), zero);
  return {
    status: 'measured' as const, model: input.model, unit: input.unit, arithmetic: 'exact-rational' as const,
    readings, union: {members: union, value: pack(total)},
    sumOfRegions: pack(regionSum), overlapExcess: pack(sub(regionSum, total)),
    disjointBySupport: [...membership.values()].every(ids => ids.length === 1),
    overlaps: [...membership].filter(([, ids]) => ids.length > 1).map(([atom, ids]) => ({atom, regions: [...ids].sort()})).sort((a, b) => a.atom < b.atom ? -1 : a.atom > b.atom ? 1 : 0),
    unassigned: [...atoms.keys()].filter(id => !membership.has(id)).sort(),
    work: {unit: 'declared-input-rows' as const, required: String(required)},
  };
}
