// work/obligations-0.4.0/repository/dist/measures/error-events.js
function errorMatrix(rows, policy, requested) {
  if (!Number.isSafeInteger(policy.minCells) || policy.minCells < 2)
    throw new Error("REFUSE\xB7measure invalid minimum cells");
  const cells = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!row.event || !row.origin || row.error !== 0 && row.error !== 1)
      throw new Error("REFUSE\xB7measure invalid error event");
    const at = cells.get(row.event) ?? /* @__PURE__ */ new Map();
    if (at.has(row.origin) && at.get(row.origin) !== row.error)
      throw new Error("REFUSE\xB7measure conflicting error event");
    at.set(row.origin, row.error);
    cells.set(row.event, at);
  }
  const origins = [...new Set(requested ?? rows.map((row) => row.origin))].sort();
  if (origins.some((origin) => !origin))
    throw new Error("REFUSE\xB7measure invalid origin");
  const events = [...cells.keys()].filter((event) => origins.some((origin) => cells.get(event).has(origin))).sort();
  if (events.length < policy.minCells || !origins.length)
    return { status: "unmeasured", cause: "insufficient observed events" };
  if (events.some((event) => origins.some((origin) => !cells.get(event).has(origin))))
    return { status: "unmeasured", cause: "incomplete shared event observations" };
  return { status: "measured", origins, events, matrix: events.map((event) => origins.map((origin) => cells.get(event).get(origin))) };
}

// work/obligations-0.4.0/repository/dist/measures/rational.js
var zero = [0n, 1n];
var one = [1n, 1n];
var refuse = (cause) => {
  throw new Error("REFUSE\xB7model/M3 " + cause);
};
var gcd = (a, b) => {
  a = a < 0n ? -a : a;
  while (b) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a;
};
function q(a, b = 1n) {
  if (b === 0n)
    refuse("zero rational denominator");
  if (b < 0n) {
    a = -a;
    b = -b;
  }
  const d = gcd(a, b);
  return [a / d, b / d];
}
function rational(input) {
  if (typeof input === "string") {
    if (/^-?\d+\/\d+$/.test(input)) {
      const [a, b] = input.split("/");
      return q(BigInt(a), BigInt(b));
    }
    if (!/^-?\d+(\.\d+)?$/.test(input))
      refuse("invalid exact probability");
    const sign = input.startsWith("-") ? -1n : 1n, text = input.replace(/^-/, "");
    const [whole, part = ""] = text.split(".");
    return q(sign * BigInt(whole + part), 10n ** BigInt(part.length));
  }
  if (!input || typeof input.numerator !== "string" || typeof input.denominator !== "string" || !/^[-]?\d+$/.test(input.numerator) || !/^\d+$/.test(input.denominator))
    refuse("invalid rational");
  return q(BigInt(input.numerator), BigInt(input.denominator));
}
var add = (a, b) => q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
var sub = (a, b) => q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
var mul = (a, b) => q(a[0] * b[0], a[1] * b[1]);
var div = (a, b) => q(a[0] * b[1], a[1] * b[0]);
var equal = (a, b) => a[0] === b[0] && a[1] === b[1];
var pack = (a) => ({ numerator: String(a[0]), denominator: String(a[1]) });
function probability(input) {
  const a = rational(input);
  if (a[0] < 0n || a[0] > a[1])
    refuse("probability outside 0..1");
  return a;
}

// work/obligations-0.4.0/repository/dist/measures/m3.js
var conditions = Object.freeze(["ordered-governance", "independent-factor-indicators", "independent-private-indicators", "independent-uniform-wrong-labels", "handed-parameters"]);
var named = (s) => typeof s === "string" && s.length > 0;
function validateM3(model) {
  if (!model || !Array.isArray(model.witnesses) || !Array.isArray(model.factors) || !Array.isArray(model.selection) || model.witnesses.some((w) => !w) || model.factors.some((f) => !f || !Array.isArray(f.members)))
    refuse("invalid model records");
  if (!named(model.cell) || !Number.isSafeInteger(model.cardinality) || model.cardinality < 2)
    refuse("invalid cell or cardinality");
  const ids = model.witnesses.map((w) => w.id);
  if (ids.some((id) => !named(id)) || new Set(ids).size !== ids.length)
    refuse("duplicate or absent witness");
  if (!model.selection.length || new Set(model.selection).size !== model.selection.length || model.selection.some((id) => !ids.includes(id)))
    refuse("invalid selection");
  const factors = [...model.factors].sort((a, b) => a.index - b.index);
  if (new Set(factors.map((f) => f.id)).size !== factors.length || new Set(factors.map((f) => f.index)).size !== factors.length)
    refuse("duplicate factor identity or index");
  for (const f of factors)
    if (!named(f.id) || !Number.isSafeInteger(f.index) || new Set(f.members).size !== f.members.length || f.members.some((id) => !ids.includes(id)))
      refuse("invalid sharing set or order");
  const required = /* @__PURE__ */ new Set([...model.selection, ...factors.filter((f) => f.members.some((id) => model.selection.includes(id))).flatMap((f) => f.members)]);
  const allPrivate = model.witnesses.map((w) => {
    if (w.privateError === void 0) {
      if (required.has(w.id))
        refuse("private probability absent for " + w.id);
      return zero;
    }
    return probability(w.privateError);
  });
  const allRates = factors.map((f) => probability(f.probability));
  const selected = model.selection.map((id) => model.witnesses[ids.indexOf(id)]);
  const touching = factors.filter((f) => f.members.some((id) => model.selection.includes(id)));
  return { witnesses: selected, factors: touching, private: selected.map((w) => allPrivate[ids.indexOf(w.id)]), rates: touching.map((f) => allRates[factors.indexOf(f)]) };
}
function limit(policy) {
  if (!policy || !/^\d+$/.test(policy.budget))
    refuse("invalid evaluator/budget");
  return BigInt(policy.budget);
}
function bells(n, cap) {
  let row = [1n];
  const result = [1n];
  for (let i = 1; i <= n; i++) {
    const next = [row[row.length - 1]];
    for (let j = 1; j <= i; j++)
      next.push(next[j - 1] + row[j - 1]);
    row = next;
    result.push(row[0]);
    if (row[0] > cap)
      break;
  }
  return result;
}
function* configurations(input, masses = true) {
  const ids = input.witnesses.map((w) => w.id), governors = ids.map(() => -1);
  function* walk(i, mass, fired) {
    if (i === input.factors.length) {
      yield { governors: [...governors], mass, fired };
      return;
    }
    yield* walk(i + 1, masses ? mul(mass, sub(one, input.rates[i])) : one, fired);
    const changed = [];
    for (let j = 0; j < ids.length; j++)
      if (governors[j] === -1 && input.factors[i].members.includes(ids[j])) {
        governors[j] = i;
        changed.push(j);
      }
    yield* walk(i + 1, masses ? mul(mass, input.rates[i]) : one, true);
    for (const j of changed)
      governors[j] = -1;
  }
  yield* walk(0, one, false);
}
function countWork(input, cap) {
  const k = input.witnesses.length, bell = bells(k + 1, cap);
  if (bell.length <= k + 1 || bell[k + 1] > cap)
    return cap + 1n;
  let factorConfigurations = 1n;
  for (let i = 0; i < input.factors.length; i++) {
    factorConfigurations *= 2n;
    if (factorConfigurations > cap)
      return cap + 1n;
  }
  let total = 0n;
  for (const c of configurations(input, false)) {
    const free = c.governors.filter((g) => g === -1).length, groups = new Set(c.governors.filter((g) => g !== -1)).size;
    let choose = 1n;
    for (let r = 0; r <= free; r++) {
      total += choose * bell[groups + r];
      if (total > cap)
        return cap + 1n;
      choose = choose * BigInt(free - r) / BigInt(r + 1);
    }
  }
  return total;
}
function conditional(a, b, cause) {
  return b[0] === 0n ? { status: "unmeasured", cause, numerator: pack(a), denominator: pack(b) } : { status: "measured", value: pack(div(a, b)), numerator: pack(a), denominator: pack(b) };
}
function evaluateM3(model, policy) {
  const input = validateM3(model), cap = limit(policy), work = countWork(input, cap);
  const metadata = { model: "M/3", parameters: model, conditions, policy };
  if (work > cap)
    return { ...metadata, status: "unmeasured", cause: "evaluator/budget", requiredAtLeast: String(work) };
  const k = input.witnesses.length, wrong = BigInt(model.cardinality - 1);
  let truth = zero, falsehood = zero, fired = zero, majorityTrue = zero, majorityFalse = zero, majorityNone = zero;
  for (const configuration of configurations(input)) {
    let privatePatterns2 = function(i, mass, correct) {
      if (mass[0] === 0n)
        return;
      if (i < free.length) {
        const p = input.private[free[i]];
        privatePatterns2(i + 1, mul(mass, sub(one, p)), correct + 1);
        weights.push(1);
        privatePatterns2(i + 1, mul(mass, p), correct);
        weights.pop();
        return;
      }
      const L = weights.length, blocks = [];
      function partitions(label) {
        if (label < L) {
          for (let j = 0; j < blocks.length; j++) {
            blocks[j] += weights[label];
            partitions(label + 1);
            blocks[j] -= weights[label];
          }
          blocks.push(weights[label]);
          partitions(label + 1);
          blocks.pop();
          return;
        }
        const b = blocks.length;
        if (BigInt(b) > wrong)
          return;
        let assignments = 1n;
        for (let j = 0; j < b; j++)
          assignments *= wrong - BigInt(j);
        const probabilityMass = mul(mass, q(assignments, wrong ** BigInt(L)));
        if (correct === k) {
          truth = add(truth, probabilityMass);
          return;
        }
        if (correct === 0 && b === 1) {
          falsehood = add(falsehood, probabilityMass);
          if (configuration.fired)
            fired = add(fired, probabilityMass);
          return;
        }
        if (2 * correct > k)
          majorityTrue = add(majorityTrue, probabilityMass);
        else if (blocks.some((weight) => 2 * weight > k))
          majorityFalse = add(majorityFalse, probabilityMass);
        else
          majorityNone = add(majorityNone, probabilityMass);
      }
      partitions(0);
    };
    var privatePatterns = privatePatterns2;
    if (configuration.mass[0] === 0n)
      continue;
    const grouped = /* @__PURE__ */ new Map();
    configuration.governors.forEach((g) => {
      if (g !== -1)
        grouped.set(g, (grouped.get(g) ?? 0) + 1);
    });
    const weights = [...grouped.values()], free = configuration.governors.flatMap((g, i) => g === -1 ? [i] : []);
    privatePatterns2(0, configuration.mass, 0);
  }
  const dissent = sub(sub(one, truth), falsehood), majorityMass = add(majorityTrue, majorityFalse), unanimity = add(truth, falsehood);
  let closedTruth = one;
  for (const p of input.private)
    closedTruth = mul(closedTruth, sub(one, p));
  for (const c of input.rates)
    closedTruth = mul(closedTruth, sub(one, c));
  if (!equal(closedTruth, truth) || !equal(dissent, add(majorityMass, majorityNone)))
    refuse("partition mass identity");
  return { ...metadata, status: "measured", work: String(work), probabilities: { true: pack(truth), false: pack(falsehood), fired: pack(fired), dissent: pack(dissent), majorityTrue: pack(majorityTrue), majorityFalse: pack(majorityFalse), majorityNone: pack(majorityNone) }, quantities: { phi: conditional(falsehood, unanimity, "no unanimity mass"), D: conditional(fired, unanimity, "no unanimity mass"), reliability: conditional(truth, unanimity, "no unanimity mass"), falseMajorityGivenDissent: conditional(majorityFalse, dissent, "no dissent mass"), falseMajorityGivenMajorityAndDissent: conditional(majorityFalse, majorityMass, "no majority mass") }, reliabilityLabel: "P(correct | unanimous) under M/3 with handed parameters" };
}
function probeUpdate(phi, error, cardinality) {
  if (!Number.isSafeInteger(cardinality) || cardinality < 2)
    refuse("invalid probe cardinality");
  const f = probability(phi), p = probability(error), a = div(mul(f, p), q(BigInt(cardinality - 1))), b = mul(sub(one, f), sub(one, p));
  return { model: "M/3", conditions: ["independent-private-only-probe", "independent-uniform-wrong-value"], parameters: { phi, error, cardinality }, result: conditional(a, add(a, b), "no extended unanimity mass") };
}
function dissentCertificate(model, fired) {
  validateM3(model);
  if (!Array.isArray(fired) || new Set(fired).size !== fired.length || fired.some((id) => !model.factors.some((f) => f.id === id)))
    refuse("invalid fired configuration");
  const selected = new Set(model.selection), active = model.factors.filter((f) => fired.includes(f.id) && f.members.some((id) => selected.has(id)));
  const covering = active.filter((f) => model.selection.every((id) => f.members.includes(id)));
  const witnesses = covering.filter((f) => !active.some((earlier) => earlier.index < f.index && !model.selection.every((id) => earlier.members.includes(id)))).map((f) => f.id);
  return { model: "M/3", parameters: { model, fired }, conditions, unanimityForced: witnesses.length > 0, coveringFactors: witnesses, meaning: "observed dissent excludes this configuration only" };
}

// work/obligations-0.4.0/repository/dist/measures/identification.js
var key = (a, b) => JSON.stringify([a, b].sort());
var gcd2 = (a, b) => b ? gcd2(b, a % b) : a;
var integerPower = (a, n) => n < 0n ? q(a[1] ** -n, a[0] ** -n) : q(a[0] ** n, a[1] ** n);
function exactRoot(a, n) {
  if (a === 0n || a === 1n || n === 1n)
    return a;
  if (n > BigInt(a.toString(2).length))
    return void 0;
  let low = 1n, high = a;
  while (low <= high) {
    const middle = (low + high) / 2n, p = middle ** n;
    if (p === a)
      return middle;
    if (p < a)
      low = middle + 1n;
    else
      high = middle - 1n;
  }
  return void 0;
}
function monomial(bases, powers) {
  let degree = 1n;
  for (const p of powers)
    degree = degree / gcd2(degree, p[1]) * p[1];
  let radicand = one;
  for (let i = 0; i < bases.length; i++)
    radicand = mul(radicand, integerPower(bases[i], powers[i][0] * (degree / powers[i][1])));
  const a = exactRoot(radicand[0], degree), b = exactRoot(radicand[1], degree);
  return { radicand: pack(radicand), degree: String(degree), rational: a === void 0 || b === void 0 ? void 0 : pack(q(a, b)) };
}
function identifyM3(input, policy) {
  if (!input || !Array.isArray(input.witnesses) || !Array.isArray(input.factors) || !Array.isArray(input.pairs) || !policy || !/^\d+$/.test(policy.budget))
    refuse("invalid identification inputs");
  const ids = input.witnesses.map((w) => w?.id);
  if (!ids.length || ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length)
    refuse("invalid identification witnesses");
  if (input.factors.some((f) => !f || typeof f.id !== "string" || !f.id || !Array.isArray(f.members) || new Set(f.members).size !== f.members.length || f.members.some((id) => !ids.includes(id))) || new Set(input.factors.map((f) => f.id)).size !== input.factors.length)
    refuse("invalid declared sharing structure");
  const s = input.witnesses.map((w) => probability(w.correct));
  const shared = input.factors.filter((f) => f.members.length > 1), rows = input.pairs.length, columns = shared.length;
  const metadata = { model: "M/3", parameters: input, conditions: ["population-moments", "declared-sharing-sets", "positive-correctness", "full-column-rank", "singleton-private-unresolved"], policy };
  if (s.some((p) => p[0] === 0n))
    return { ...metadata, status: "unmeasured", cause: "zero correctness; unidentified" };
  const seen = /* @__PURE__ */ new Set(), bases = [], matrix = [];
  for (const pair of input.pairs) {
    if (!pair || pair.a === pair.b || !ids.includes(pair.a) || !ids.includes(pair.b) || seen.has(key(pair.a, pair.b)))
      refuse("invalid identification pair");
    seen.add(key(pair.a, pair.b));
    const a = s[ids.indexOf(pair.a)], b = s[ids.indexOf(pair.b)], joint = probability(pair.correctTogether);
    if (joint[0] === 0n || sub(joint, a)[0] > 0n || sub(joint, b)[0] > 0n || sub(joint, sub(add(a, b), one))[0] < 0n)
      return { ...metadata, status: "unmeasured", cause: "model/M misfit" };
    bases.push(div(joint, mul(a, b)));
    matrix.push(shared.map((f) => f.members.includes(pair.a) && f.members.includes(pair.b) ? one : zero));
  }
  const work = BigInt(rows) * BigInt(columns) * BigInt(rows + columns + 1);
  if (work > BigInt(policy.budget))
    return { ...metadata, status: "unmeasured", cause: "identification/budget", required: String(work) };
  const transform = matrix.map((_, i) => matrix.map((__, j) => i === j ? one : zero));
  let rank = 0;
  const pivots = [];
  for (let column = 0; column < columns; column++) {
    const pivot = matrix.findIndex((row, i) => i >= rank && row[column][0] !== 0n);
    if (pivot < 0)
      continue;
    [matrix[rank], matrix[pivot]] = [matrix[pivot], matrix[rank]];
    [transform[rank], transform[pivot]] = [transform[pivot], transform[rank]];
    const divisor = matrix[rank][column];
    matrix[rank] = matrix[rank].map((v) => div(v, divisor));
    transform[rank] = transform[rank].map((v) => div(v, divisor));
    for (let i = 0; i < rows; i++)
      if (i !== rank) {
        const amount = matrix[i][column];
        matrix[i] = matrix[i].map((v, j) => sub(v, mul(amount, matrix[rank][j])));
        transform[i] = transform[i].map((v, j) => sub(v, mul(amount, transform[rank][j])));
      }
    pivots.push(column);
    rank++;
  }
  if (rank !== columns)
    return { ...metadata, status: "unmeasured", cause: "rank-deficient declared sharing system", rank, columns };
  for (let i = rank; i < rows; i++) {
    const residual = monomial(bases, transform[i]);
    if (!equal(q(BigInt(residual.radicand.numerator), BigInt(residual.radicand.denominator)), one))
      return { ...metadata, status: "unmeasured", cause: "model/M misfit", rank, columns };
  }
  const factors = shared.map((factor, j) => {
    const powers = transform[pivots.indexOf(j)], inverseSurvival = monomial(bases, powers);
    const radicand = q(BigInt(inverseSurvival.radicand.numerator), BigInt(inverseSurvival.radicand.denominator));
    if (sub(radicand, one)[0] < 0n)
      return { id: factor.id, misfit: true };
    const survival = monomial(bases, powers.map((p) => q(-p[0], p[1])));
    return { id: factor.id, survival, probability: survival.rational ? pack(sub(one, q(BigInt(survival.rational.numerator), BigInt(survival.rational.denominator)))) : void 0 };
  });
  if (factors.some((f) => "misfit" in f))
    return { ...metadata, status: "unmeasured", cause: "model/M misfit", rank, columns };
  const residualSurvival = input.witnesses.map((w, i) => {
    const powers = bases.map(() => zero);
    shared.forEach((f, j) => {
      if (f.members.includes(w.id))
        transform[pivots.indexOf(j)].forEach((p, k) => {
          powers[k] = add(powers[k], p);
        });
    });
    const r = monomial([s[i], ...bases], [one, ...powers]);
    return { witness: w.id, r, privateSingletonDecomposition: "unresolved" };
  });
  if (residualSurvival.some((w) => sub(q(BigInt(w.r.radicand.numerator), BigInt(w.r.radicand.denominator)), one)[0] > 0n))
    return { ...metadata, status: "unmeasured", cause: "model/M misfit", rank, columns };
  return { ...metadata, status: "identified", rank, columns, factors, residualSurvival, representation: "positive exact rational roots" };
}

// work/obligations-0.4.0/repository/dist/measures/m3-experiment.js
function experimentM3(model, policy) {
  validateM3(model);
  if (!policy || policy.prng !== "xorshift32" || !Number.isInteger(policy.seed) || policy.seed <= 0 || policy.seed > 4294967295 || !Number.isSafeInteger(policy.trials) || policy.trials < 1 || !Number.isSafeInteger(policy.randomWords) || policy.randomWords < 0)
    refuse("invalid experiment policy");
  const metadata = { model: "M/3", parameters: model, policy, conditions: ["controlled-simulation", "declared-xorshift32-stream", "exact-rational-event-sampling", "not-a-law"] };
  let x = policy.seed >>> 0, words = 0;
  const exhausted = /* @__PURE__ */ Symbol("experiment/random-words");
  const word = () => {
    if (words === policy.randomWords)
      throw exhausted;
    words++;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return BigInt(x >>> 0);
  };
  const below = (n) => {
    if (n === 1n)
      return 0n;
    const bits = BigInt((n - 1n).toString(2).length), mask = (1n << bits) - 1n;
    for (; ; ) {
      let r = 0n;
      for (let b = 0n; b < bits; b += 32n)
        r = r << 32n | word();
      r &= mask;
      if (r < n)
        return r;
    }
  };
  const bernoulli = (p2) => p2[0] === 0n ? false : p2[0] === p2[1] ? true : below(p2[1]) < p2[0];
  const factors = [...model.factors].filter((f) => f.members.some((id) => model.selection.includes(id))).sort((a, b) => a.index - b.index);
  const c = factors.map((f) => probability(f.probability)), p = model.selection.map((id) => probability(model.witnesses.find((w) => w.id === id).privateError)), k = model.selection.length;
  const counts = { true: 0, false: 0, fired: 0, dissent: 0, majorityTrue: 0, majorityFalse: 0, majorityNone: 0 };
  try {
    for (let trial = 0; trial < policy.trials; trial++) {
      const governors = model.selection.map(() => -1);
      let fired = false;
      factors.forEach((f, i) => {
        if (bernoulli(c[i])) {
          fired = true;
          model.selection.forEach((id, j) => {
            if (governors[j] === -1 && f.members.includes(id))
              governors[j] = i;
          });
        }
      });
      const labels = /* @__PURE__ */ new Map(), values = /* @__PURE__ */ new Map();
      const wrong = () => Number(below(BigInt(model.cardinality - 1))) + 1;
      governors.forEach((g, i) => {
        let value = 0;
        if (g !== -1) {
          if (!labels.has(g))
            labels.set(g, wrong());
          value = labels.get(g);
        } else if (bernoulli(p[i]))
          value = wrong();
        values.set(value, (values.get(value) ?? 0) + 1);
      });
      if (values.size === 1) {
        if (values.has(0))
          counts.true++;
        else {
          counts.false++;
          if (fired)
            counts.fired++;
        }
      } else {
        counts.dissent++;
        if (2 * (values.get(0) ?? 0) > k)
          counts.majorityTrue++;
        else if ([...values].some(([value, count]) => value !== 0 && 2 * count > k))
          counts.majorityFalse++;
        else
          counts.majorityNone++;
      }
    }
  } catch (error) {
    if (error !== exhausted)
      throw error;
    return { ...metadata, status: "unmeasured", cause: "experiment/random-words", words };
  }
  const conditional2 = (numerator, denominator) => ({ numerator, denominator, rate: denominator ? numerator / denominator : "unmeasured" });
  return { ...metadata, status: "measured", words, counts, unanimity: conditional2(counts.false, counts.true + counts.false), falseMajorityGivenDissent: conditional2(counts.majorityFalse, counts.dissent), falseMajorityGivenMajorityAndDissent: conditional2(counts.majorityFalse, counts.majorityTrue + counts.majorityFalse) };
}

// work/obligations-0.4.0/repository/dist/measures/fitting.js
function solve(matrix, values, tolerance) {
  const a = matrix.map((row, i) => [...row, values[i]]), n = a.length;
  for (let j = 0; j < n; j++) {
    let pivot = j;
    for (let i = j + 1; i < n; i++)
      if (Math.abs(a[i][j]) > Math.abs(a[pivot][j]))
        pivot = i;
    if (Math.abs(a[pivot][j]) <= tolerance)
      return void 0;
    [a[j], a[pivot]] = [a[pivot], a[j]];
    const d = a[j][j];
    a[j] = a[j].map((v) => v / d);
    for (let i = 0; i < n; i++)
      if (i !== j) {
        const p = a[i][j];
        a[i] = a[i].map((v, k) => v - p * a[j][k]);
      }
  }
  return a.map((row) => row[n]);
}
function* subsets(total, max, start = 0, prefix = []) {
  yield prefix;
  if (prefix.length === max)
    return;
  for (let i = start; i < total; i++)
    yield* subsets(total, max, i + 1, [...prefix, i]);
}
function fitM3(rows, structure, policy) {
  if (!policy || !/^\d+$/.test(policy.activeSets) || !Number.isFinite(policy.solveTolerance) || policy.solveTolerance <= 0 || !Number.isFinite(policy.residualTolerance) || policy.residualTolerance < 0 || !policy.bootstrap || policy.bootstrap.prng !== "xorshift32" || !Number.isInteger(policy.bootstrap.seed) || policy.bootstrap.seed < 1 || policy.bootstrap.seed > 4294967295 || !Number.isSafeInteger(policy.bootstrap.B) || policy.bootstrap.B < 0 || !Number.isSafeInteger(policy.bootstrap.randomWords) || policy.bootstrap.randomWords < 0)
    refuse("invalid fitting policy");
  const reading = errorMatrix(rows, policy.observation), metadata = { model: "M/3", parameters: { rows, structure }, policy, conditions: ["one-declared-parameter-population", "declared-sharing-sets", "finite-data", "no-pseudocounts", "fitted-not-handed"], procedure: "constrained-log-least-squares/active-set@1" };
  if (reading.status === "unmeasured")
    return { ...metadata, ...reading };
  if (!structure || !Array.isArray(structure.factors) || structure.factors.some((f) => !f) || new Set(structure.factors.map((f) => f.id)).size !== structure.factors.length || structure.factors.some((f) => !f.id || !Array.isArray(f.members) || new Set(f.members).size !== f.members.length || f.members.some((id) => !reading.origins.includes(id))))
    refuse("invalid fitting sharing structure");
  const shared = structure.factors.filter((f) => f.members.length > 1), n = shared.length, w = reading.origins.length;
  const pairs = [...reading.origins.flatMap((_, i) => reading.origins.flatMap((__, j) => j > i ? [[i, j]] : []))];
  const A = pairs.map(([i, j]) => shared.map((f) => f.members.includes(reading.origins[i]) && f.members.includes(reading.origins[j]) ? 1 : 0));
  const H = shared.map((_, i) => shared.map((__, j) => A.reduce((sum, row) => sum + row[i] * row[j], 0)));
  if (n && !solve(H, Array(n).fill(0), policy.solveTolerance))
    return { ...metadata, status: "unmeasured", cause: "rank-deficient declared sharing system" };
  let combinations = 1n, term = 1n;
  for (let k = 1; k <= n; k++) {
    term = term * BigInt(n + w - k + 1) / BigInt(k);
    combinations += term;
  }
  const required = combinations * BigInt(policy.bootstrap.B + 1);
  if (required > BigInt(policy.activeSets))
    return { ...metadata, status: "unmeasured", cause: "fitting/active-sets", required: String(required) };
  const once = (data) => {
    const s = reading.origins.map((_, i) => data.reduce((sum, row) => sum + (1 - row[i]), 0) / data.length);
    if (s.some((v) => v === 0))
      return { status: "unmeasured", cause: "model/M misfit: zero correct count" };
    const joints = pairs.map(([i, j]) => data.reduce((sum, row) => sum + (1 - row[i]) * (1 - row[j]), 0) / data.length);
    if (joints.some((v) => v === 0))
      return { status: "unmeasured", cause: "model/M misfit: zero joint-correct count" };
    const y = joints.map((v, k) => Math.log(v / (s[pairs[k][0]] * s[pairs[k][1]]))), g = shared.map((_, j) => A.reduce((sum, row, i) => sum + row[j] * y[i], 0));
    const C = [...shared.map((_, i) => shared.map((__, j) => i === j ? -1 : 0)), ...reading.origins.map((id) => shared.map((f) => f.members.includes(id) ? 1 : 0))], d = [...shared.map(() => 0), ...s.map((v) => -Math.log(v))];
    let best, bestCost = Infinity;
    for (const active of subsets(n + w, n)) {
      const size = n + active.length, K = Array.from({ length: size }, () => Array(size).fill(0));
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          K[i][j] = H[i][j];
      active.forEach((constraint, k) => C[constraint].forEach((v, j) => {
        K[n + k][j] = v;
        K[j][n + k] = v;
      }));
      const candidate = solve(K, [...g, ...active.map((i) => d[i])], policy.solveTolerance);
      if (!candidate)
        continue;
      const alpha = candidate.slice(0, n), lambda = candidate.slice(n);
      if (alpha.some((v) => v < 0) || lambda.some((v) => v < -policy.solveTolerance) || C.some((row, i) => row.reduce((sum, v, j) => sum + v * alpha[j], 0) > d[i] + policy.solveTolerance))
        continue;
      const cost = A.reduce((sum, row, i) => sum + (row.reduce((s2, v, j) => s2 + v * alpha[j], 0) - y[i]) ** 2, 0);
      if (cost < bestCost) {
        best = alpha;
        bestCost = cost;
      }
    }
    if (!best)
      return { status: "unmeasured", cause: "model/M misfit: no feasible numerical solution" };
    const residuals = A.map((row, i) => row.reduce((sum, v, j) => sum + v * best[j], 0) - y[i]);
    if (residuals.some((v) => Math.abs(v) > policy.residualTolerance))
      return { status: "unmeasured", cause: "model/M misfit: residual tolerance", residuals };
    return { status: "fitted", factors: shared.map((f, i) => ({ id: f.id, probability: 1 - Math.exp(-best[i]) })), residuals, residualSumSquares: bestCost, residualSurvival: reading.origins.map((id, i) => ({ id, r: s[i] * Math.exp(shared.reduce((sum, f, j) => sum + (f.members.includes(id) ? best[j] : 0), 0)), privateSingletonDecomposition: "unresolved" })) };
  };
  const fit = once(reading.matrix);
  if (fit.status !== "fitted")
    return { ...metadata, ...fit };
  let x = policy.bootstrap.seed >>> 0, words = 0;
  const exhausted = /* @__PURE__ */ Symbol("bootstrap/random-words");
  const index = () => {
    const N = reading.matrix.length, limit2 = Math.floor(4294967296 / N) * N;
    for (; ; ) {
      if (words === policy.bootstrap.randomWords)
        throw exhausted;
      words++;
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      const r = x >>> 0;
      if (r < limit2)
        return r % N;
    }
  };
  const replicates = [];
  try {
    for (let b = 0; b < policy.bootstrap.B; b++)
      replicates.push(once(reading.matrix.map(() => reading.matrix[index()])));
  } catch (error) {
    if (error !== exhausted)
      throw error;
    return { ...metadata, ...fit, bootstrap: { status: "unmeasured", cause: "bootstrap/random-words", words } };
  }
  const complete = policy.bootstrap.B > 0 && replicates.every((r) => r.status === "fitted");
  return { ...metadata, ...fit, bootstrap: { status: complete ? "measured" : "unmeasured", cause: complete ? void 0 : policy.bootstrap.B ? "model/M misfit in bootstrap replicates" : "no bootstrap replicates requested", words, replicates }, quantities: "\u03A6 and D require handed parameters; never reported from this fit" };
}

// work/obligations-0.4.0/repository/dist/lattice/errors.js
var UnitError = class _UnitError extends Error {
  code;
  detail;
  constructor(code, message, detail = {}) {
    super(message);
    this.name = "UnitError";
    this.code = code;
    this.detail = Object.freeze({ ...detail });
    Object.setPrototypeOf(this, _UnitError.prototype);
  }
};

// work/obligations-0.4.0/repository/dist/lattice/order.js
function build(levels, join, meet) {
  const n = levels.length;
  for (let i = 0; i < n; i++) {
    if (levels.indexOf(levels[i]) !== i) {
      throw new UnitError("DUPLICATE_LEVEL", `the level \`${levels[i]}\` is declared twice`, {
        level: levels[i]
      });
    }
  }
  const index = new Map(levels.map((l, i) => [l, i]));
  const leq = (a, b) => join[a][b] === b;
  const total = levels.every((_, i) => levels.every((__, j) => join[i][j] === i || join[i][j] === j));
  let simple = true;
  for (let x = 0; x < n && simple; x++) {
    for (let y = 0; y < n && simple; y++) {
      for (let z = 0; z < n; z++) {
        if (meet[x][join[y][z]] !== join[meet[x][y]][meet[x][z]]) {
          simple = false;
          break;
        }
      }
    }
  }
  const all = [...levels.keys()];
  const bottomIx = all.find((i) => all.every((j) => leq(i, j))) ?? 0;
  const topIx = all.find((i) => all.every((j) => leq(j, i))) ?? n - 1;
  const joinIrr = all.filter((j) => j !== bottomIx && all.filter((x) => x !== j && leq(x, j)).reduce((acc, x) => join[acc][x], bottomIx) !== j);
  const meetIrr = all.filter((m) => m !== topIx && all.filter((x) => x !== m && leq(m, x)).reduce((acc, x) => meet[acc][x], topIx) !== m);
  const seen = /* @__PURE__ */ new Set();
  const allDebits = [];
  for (const x of [...joinIrr, ...meetIrr]) {
    if (!seen.has(x)) {
      seen.add(x);
      allDebits.push(x);
    }
  }
  return {
    levels,
    isLadder: total,
    isSimple: simple,
    bottomIx,
    topIx,
    bottom: levels[bottomIx],
    top: levels[topIx],
    leq,
    higher: (a, b) => join[a][b],
    lower: (a, b) => meet[a][b],
    rank(level) {
      const r = index.get(level);
      if (r === void 0) {
        throw new UnitError("UNKNOWN_LEVEL", `no level \`${level}\` in this scale`, {
          level,
          levels
        });
      }
      return r;
    },
    stateOf(floor, ceiling) {
      if (!leq(floor, ceiling))
        return "CONFLICT";
      if (floor !== bottomIx)
        return "REQUIRED";
      if (ceiling !== topIx)
        return "FORBIDDEN";
      return "FREE";
    },
    joins: () => joinIrr.slice(),
    limits: () => meetIrr.slice(),
    debits: () => allDebits.slice(),
    intervalHeight(lo, hi) {
      if (!leq(lo, hi))
        return null;
      const inside = all.filter((x) => leq(lo, x) && leq(x, hi));
      const covers = (x) => inside.filter((y) => y !== x && leq(x, y) && !inside.some((z) => z !== x && z !== y && leq(x, z) && leq(z, y)));
      const long = /* @__PURE__ */ new Map([[lo, 0]]);
      const short = /* @__PURE__ */ new Map([[lo, 0]]);
      const walk = [...inside].sort((a, b) => inside.filter((z) => leq(z, a)).length - inside.filter((z) => leq(z, b)).length);
      for (const x of walk) {
        const lx = long.get(x);
        const sx = short.get(x);
        if (lx === void 0 || sx === void 0)
          continue;
        for (const y of covers(x)) {
          long.set(y, Math.max(long.get(y) ?? lx + 1, lx + 1));
          short.set(y, Math.min(short.get(y) ?? sx + 1, sx + 1));
        }
      }
      const l = long.get(hi);
      return l !== void 0 && l === short.get(hi) ? l : null;
    }
  };
}
function chain(levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new UnitError("EMPTY_CHAIN", "a chain needs at least one level");
  }
  const n = levels.length;
  const grid = (f) => [...Array(n)].map((_, i) => [...Array(n)].map((__, j) => f(i, j)));
  return build(levels, grid(Math.max), grid(Math.min));
}

// work/obligations-0.4.0/repository/dist/debit/unit.js
function unit(subject, bounds) {
  return { subject, floor: bounds.floor, ceiling: bounds.ceiling };
}
function state(c, u) {
  return c.stateOf(c.rank(u.floor), c.rank(u.ceiling));
}

// work/obligations-0.4.0/m3-reader.mjs
function observe(bytes) {
  const sample = JSON.parse(new TextDecoder().decode(bytes));
  const scale = chain(["off", "on"]), cells = [unit("free", { floor: "off", ceiling: "on" }), unit("required", { floor: "on", ceiling: "on" }), unit("forbidden", { floor: "off", ceiling: "off" }), unit("conflict", { floor: "on", ceiling: "off" })];
  const before = JSON.stringify(cells), states = cells.map((c) => state(scale, c));
  cells.forEach(Object.freeze);
  const results = sample.models.map((entry) => ({ name: entry.name, result: evaluateM3(entry.model, sample.policy) }));
  const phi = { numerator: "797", denominator: "10373" };
  const probes = ["0.2", "0.98", "0.99", "1"].map((error) => probeUpdate(phi, error, 64));
  const identification = sample.identifications.map((input) => identifyM3(input, sample.identificationPolicy));
  const experiment = experimentM3(sample.models[0].model, sample.experiment);
  const fitting = sample.fits.map((input) => fitM3(input.rows, input.structure, input.policy));
  const certificate = dissentCertificate(sample.models[0].model, []);
  if (JSON.stringify(cells) !== before || JSON.stringify(cells.map((c) => state(scale, c))) !== JSON.stringify(states)) throw Error("REFUSE\xB7model/M3 algebra changed");
  return [{ scope: "measurement/m3/" + sample.place, role: "writes", measure: "result", bound: { kind: "enumerated", values: [JSON.stringify({ results, probes, identification, experiment, fitting, certificate, states })] } }];
}
export {
  observe
};
