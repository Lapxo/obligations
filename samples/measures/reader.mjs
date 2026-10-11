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
function covariance(reading) {
  if (reading.status === "unmeasured")
    return reading;
  const n = reading.events.length, m = reading.origins.length;
  if (!n || !m || reading.matrix.length !== n || reading.matrix.some((row) => row.length !== m || row.some((x) => x !== 0 && x !== 1)) || new Set(reading.events).size !== n || new Set(reading.origins).size !== m)
    throw new Error("REFUSE\xB7measure invalid error matrix");
  const mean = reading.origins.map((_, i) => reading.matrix.reduce((sum, row) => sum + row[i], 0) / n);
  const matrix = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_2, j) => reading.matrix.reduce((sum, row) => sum + (row[i] - mean[i]) * (row[j] - mean[j]), 0) / n));
  return { ...reading, matrix };
}
var errorCovariance = (rows, policy) => covariance(errorMatrix(rows, policy));
function participationRatio(reading) {
  if (reading.status === "unmeasured")
    return reading;
  const trace = reading.matrix.reduce((sum, row, i) => sum + row[i], 0);
  const square = reading.matrix.reduce((sum, row) => sum + row.reduce((n, value) => n + value * value, 0), 0);
  if (square === 0)
    return { status: "unmeasured", cause: "zero observed variation; dependence unidentified" };
  return { status: "measured", value: trace * trace / square };
}

// work/obligations-0.4.0/repository/dist/measures/spectrum.js
var refuse = (cause) => {
  throw new Error("REFUSE\xB7measure " + cause);
};
function spectrum(reading, policy) {
  if (reading.status === "unmeasured")
    return reading;
  if (!Number.isFinite(policy.absolute) || policy.absolute <= 0 || !Number.isFinite(policy.relative) || policy.relative < 0 || !Number.isSafeInteger(policy.maxRotations) || policy.maxRotations < 1)
    refuse("invalid numerical policy");
  const n = reading.origins.length, original = reading.matrix;
  if (!n || original.length !== n || original.some((row) => row.length !== n || row.some((x) => !Number.isFinite(x))))
    refuse("invalid covariance matrix");
  const scale = Math.max(...original.flat().map(Math.abs)), tolerance = policy.absolute + policy.relative * scale;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (original[i][j] !== original[j][i])
        refuse("nonsymmetric covariance");
  const a = original.map((row) => [...row]), v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_2, j) => i === j ? 1 : 0));
  for (let step = 0; step < policy.maxRotations; step++) {
    let p = 0, q = 0, largest = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(a[i][j]) > largest) {
          largest = Math.abs(a[i][j]);
          p = i;
          q = j;
        }
    if (largest <= tolerance)
      break;
    const theta = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), c = Math.cos(theta), s = Math.sin(theta);
    const pp = a[p][p], qq = a[q][q], pq = a[p][q];
    for (let k = 0; k < n; k++)
      if (k !== p && k !== q) {
        const x = a[k][p], y = a[k][q];
        a[k][p] = a[p][k] = c * x - s * y;
        a[k][q] = a[q][k] = s * x + c * y;
      }
    a[p][p] = c * c * pp - 2 * s * c * pq + s * s * qq;
    a[q][q] = s * s * pp + 2 * s * c * pq + c * c * qq;
    a[p][q] = a[q][p] = 0;
    for (let k = 0; k < n; k++) {
      const x = v[k][p], y = v[k][q];
      v[k][p] = c * x - s * y;
      v[k][q] = s * x + c * y;
    }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j][j] - a[i][i] || i - j);
  const raw = order.map((i) => a[i][i]);
  if (raw.some((x) => x < -tolerance))
    refuse("covariance is not positive semidefinite");
  const values = raw.map((x) => Math.max(0, x)), vectors = order.map((i) => v.map((row) => row[i]));
  const residual = Math.max(...vectors.map((vector, i) => Math.hypot(...original.map((row, j) => row.reduce((sum, x, k) => sum + x * vector[k], 0) - values[i] * vector[j]))));
  if (residual > n * tolerance)
    return { status: "unmeasured", cause: "eigensolver did not converge within declared budget" };
  return { status: "measured", origins: reading.origins, values, vectors, tolerance, residual };
}
function commonMass(reading) {
  if (reading.status === "unmeasured")
    return reading;
  const total = reading.values.reduce((sum, x) => sum + x, 0);
  return total <= reading.tolerance ? { status: "unmeasured", cause: "no resolved variation" } : { status: "measured", value: reading.values[0] / total };
}
function loadings(reading) {
  if (reading.status === "unmeasured")
    return reading;
  if (reading.values[0] <= reading.tolerance || reading.values.length > 1 && reading.values[0] - reading.values[1] <= 2 * reading.tolerance)
    return { status: "unmeasured", cause: "top eigenspace is unresolved or repeated" };
  return { status: "measured", origins: reading.origins, values: reading.vectors[0].map(Math.abs) };
}
function commonMassOf(reading, origins, tau) {
  if (reading.status === "unmeasured")
    return reading;
  if (!Number.isFinite(tau) || tau <= 0 || tau > 1)
    refuse("invalid spectral threshold");
  const selected = [...new Set(origins)].map((origin) => reading.origins.indexOf(origin));
  if (!selected.length || selected.some((i) => i < 0))
    return { status: "unmeasured", cause: "subset not observed" };
  const energy = reading.values.map((value, k) => value * selected.reduce((sum, i) => sum + reading.vectors[k][i] ** 2, 0));
  const total = energy.reduce((sum, x) => sum + x, 0);
  if (total <= reading.tolerance)
    return { status: "unmeasured", cause: "no resolved subset variation" };
  const cutoff = tau * reading.values[0];
  if (reading.values.some((value) => Math.abs(value - cutoff) <= 2 * reading.tolerance) && tau !== 1)
    return { status: "unmeasured", cause: "spectral threshold unresolved at tolerance" };
  const common = energy.reduce((sum, x, k) => sum + (reading.values[k] >= cutoff - 2 * reading.tolerance ? x : 0), 0);
  return { status: "measured", value: common / total };
}

// work/obligations-0.4.0/repository/dist/measures/model.js
function valid({ c, p, n }) {
  if (!Number.isFinite(c) || c < 0 || c > 1 || !Number.isFinite(p) || p < 0 || p > 1 || !Number.isSafeInteger(n) || n < 2)
    throw new Error("REFUSE\xB7measure invalid unanimity model");
}
function logSum(a, b) {
  const high = Math.max(a, b);
  return high === -Infinity ? high : high + Math.log(Math.exp(a - high) + Math.exp(b - high));
}
function unanimityFloor(model, k) {
  valid(model);
  if (!Number.isSafeInteger(k) || k < 1)
    throw new Error("REFUSE\xB7measure invalid witness count");
  const { c, p, n } = model;
  if (c === 1 || p === 1)
    return { status: "measured", value: 1 };
  if (p === 0)
    return { status: "measured", value: c };
  const logPrivate = Math.log1p(-c) + k * Math.log(p) + (1 - k) * Math.log(n - 1);
  const logA = logSum(c === 0 ? -Infinity : Math.log(c), logPrivate), logB = Math.log1p(-c) + k * Math.log1p(-p);
  const odds = logA - logB;
  const value = odds >= 0 ? 1 / (1 + Math.exp(-odds)) : Math.exp(odds) / (1 + Math.exp(odds));
  return { status: "measured", value };
}
function unanimityThreshold(model, searchLimit) {
  valid(model);
  if (!Number.isSafeInteger(searchLimit) || searchLimit < 1)
    throw new Error("REFUSE\xB7measure invalid search budget");
  const { c, p, n } = model, q = p / (n - 1), coefficient = 1 - p - q;
  if (c === 1 || p === 0 || p === 1 || coefficient <= 0)
    return { status: "measured", value: 1 };
  if (c === 0)
    return { status: "unmeasured", cause: "no finite nondecreasing threshold for this model" };
  const right = Math.log(p) + Math.log(c), base = Math.log(coefficient) + Math.log1p(-c) + Math.log(n - 1);
  for (let k = 1; k <= searchLimit; k++)
    if (base + k * Math.log(q) <= right)
      return { status: "measured", value: k };
  return { status: "unmeasured", cause: "threshold outside declared search budget" };
}
function descentCount(graph, cell) {
  const nodes = /* @__PURE__ */ new Map();
  for (const node of graph) {
    if (!node.scope || nodes.has(node.scope))
      throw new Error("REFUSE\xB7measure duplicate or absent graph scope");
    nodes.set(node.scope, [...new Set(node.restsOn)]);
  }
  if (!nodes.has(cell) || [...nodes.values()].some((parents) => parents.some((parent) => !nodes.has(parent))))
    return { status: "unmeasured", cause: "incomplete declared descent graph" };
  const seen = /* @__PURE__ */ new Map(), visiting = /* @__PURE__ */ new Set();
  function reaches(scope) {
    if (visiting.has(scope))
      throw new Error("REFUSE\xB7measure cyclic descent at " + scope);
    if (seen.has(scope))
      return seen.get(scope);
    visiting.add(scope);
    let result = false;
    for (const parent of nodes.get(scope)) {
      const nested = reaches(parent);
      result = result || parent === cell || nested;
    }
    visiting.delete(scope);
    seen.set(scope, result);
    return result;
  }
  let count = 0;
  for (const scope of nodes.keys())
    if (reaches(scope) && scope !== cell)
      count++;
  return { status: "measured", value: count };
}

// work/obligations-0.4.0/repository/dist/measures/experiments.js
function stream(policy) {
  if (!Number.isInteger(policy.seed) || policy.seed <= 0 || policy.seed > 4294967295 || !Number.isSafeInteger(policy.trials) || policy.trials < 1)
    throw new Error("REFUSE\xB7experiment invalid seed or trial count");
  let x = policy.seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
var rate = (events, falseEvents) => ({ events, falseEvents, rate: events ? falseEvents / events : "unmeasured" });
var wrong = (random, n, bias = 0) => random() < bias ? 1 : 1 + Math.floor(random() * (n - 1));
function dissentExperiment(model, k, policy) {
  unanimityFloor(model, k);
  const random = stream(policy);
  let unanimous = 0, unanimousFalse = 0, majority = 0, majorityFalse = 0;
  for (let trial = 0; trial < policy.trials; trial++) {
    const common = random() < model.c;
    const counts = /* @__PURE__ */ new Map();
    for (let i = 0; i < k; i++) {
      const value = common ? 1 : random() < model.p ? wrong(random, model.n) : 0;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    for (const [value, count] of counts) {
      if (count === k) {
        unanimous++;
        if (value !== 0)
          unanimousFalse++;
      } else if (count > k / 2) {
        majority++;
        if (value !== 0)
          majorityFalse++;
      }
    }
  }
  return { unanimity: rate(unanimous, unanimousFalse), majorityWithDissent: rate(majority, majorityFalse) };
}
function interestExperiment(model, bias, shared, policy) {
  unanimityFloor(model, 2);
  if (!Number.isFinite(bias) || bias < 0 || bias > 1)
    throw new Error("REFUSE\xB7experiment invalid interest bias");
  const random = stream(policy);
  let agreed = 0, falseAgreed = 0;
  for (let trial = 0; trial < policy.trials; trial++) {
    const common = random() < model.c;
    const a = common ? 1 : random() < model.p ? wrong(random, model.n, bias) : 0;
    const b = common ? 1 : random() < model.p ? wrong(random, model.n, shared ? bias : 0) : 0;
    if (a === b) {
      agreed++;
      if (a !== 0)
        falseAgreed++;
    }
  }
  return rate(agreed, falseAgreed);
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

// work/obligations-0.4.0/quartet-reader.mjs
function evaluate(sample) {
  const scale = chain(["off", "on"]), cells = [unit("free", { floor: "off", ceiling: "on" }), unit("required", { floor: "on", ceiling: "on" }), unit("forbidden", { floor: "off", ceiling: "off" }), unit("conflict", { floor: "on", ceiling: "off" })];
  const before = JSON.stringify(cells), states = cells.map((cell) => state(scale, cell));
  cells.forEach(Object.freeze);
  let result;
  switch (sample.group) {
    case "observations":
      result = errorCovariance(sample.rows, sample.policy);
      break;
    case "spectrum": {
      const cov = sample.matrix ? { status: "measured", origins: sample.origins, events: [], matrix: sample.matrix } : errorCovariance(sample.rows, sample.observationPolicy);
      const eigen = spectrum(cov, sample.policy);
      result = { rank: sample.matrix ? "unmeasured" : participationRatio(cov), commonMass: commonMass(eigen), loadings: loadings(eigen), subset: commonMassOf(eigen, sample.origins, sample.tau), state: states[0] };
      break;
    }
    case "unanimity": {
      const sequence = [1, 2, 3].map((k) => unanimityFloor(sample.model, k));
      if (sample.claim === "monotone-from-one" && sequence[1].value < sequence[0].value) throw Error("REFUSE\xB7measure T1 monotonicity counterexample " + JSON.stringify({ sequence, threshold: unanimityThreshold(sample.model, sample.searchLimit) }));
      result = { F: unanimityFloor(sample.model, sample.k), threshold: unanimityThreshold(sample.model, sample.searchLimit), dissent: dissentExperiment(sample.model, sample.k, sample.experiment), interest: interestExperiment(sample.model, sample.bias, sample.shared, sample.experiment), sequence };
      break;
    }
    case "descent":
      result = descentCount(sample.graph, sample.cell);
      break;
    default:
      throw Error("REFUSE\xB7measure unknown quartet");
  }
  if (JSON.stringify(cells) !== before || JSON.stringify(cells.map((cell) => state(scale, cell))) !== JSON.stringify(states)) throw Error("REFUSE\xB7measure algebra state changed");
  return { result, states };
}
function observe(bytes) {
  const sample = JSON.parse(new TextDecoder().decode(bytes));
  return [{ scope: "measurement/" + sample.group + "/" + sample.place, role: "writes", measure: "result", bound: { kind: "enumerated", values: [JSON.stringify(evaluate(sample))] } }];
}
export {
  evaluate,
  observe
};
