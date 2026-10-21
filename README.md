<p><img src="docs/img/logo.svg" alt=""></p>

# @lapxo/obligations

![version 0.4.7](https://img.shields.io/badge/version-0.4.7-) ![license MIT](https://img.shields.io/badge/license-MIT-) ![node >=22.12](https://img.shields.io/badge/node-%3E%3D22.12-) [![DOI 10.5281/zenodo.21858428](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21858428-)](https://doi.org/10.5281/zenodo.21858428)

The algebra of a cell: two poles, origins with phase, eight acts.

## The idea

Every quantity a system answers for has two marks on one scale. The floor is what must hold, the ceiling is what may hold, and the pair is a cell. Two origins that touch one cell and whose marks meet make information; two whose marks do not meet make a fork that no average can close.

Four words carry the whole library. A floor, a ceiling, an origin and an epoch. A price is the distance between the marks, a state is where they stand, a verdict is what an origin found, a horizon is what no origin has reached, and none of them is a new idea: each is read off those four.

The pure API `@lapxo/obligations/measures` describes error histories of origins: covariance, spectrum, effective rank and common variance. It ships M/3 as the reference conditional model with an exact rational evaluator. No measure changes a state; observed association never establishes independence. [Measures](docs/measures.md).

## Measures on declared regions

The public measures API includes `finiteRegionMeasure`: an exact nonnegative atomic valuation on declared finite support. It reports the union, overlap excess and unassigned atoms. Disjoint support makes region sums additive; overlapping selectors do not. The caller declares the model, unit and work budget.

`key-lineage-independence@1` separates admitted keys from independent causes. Multiple signatures establish neither joint independence nor distinct control. See the [region measure](docs/contracts/region-measure.md) and [key lineage](docs/contracts/key-lineage-independence.md) contracts.

The theory contracts distinguish [retained withdrawal witnesses](docs/contracts/withdrawal-witness.md), [finite linear influence](docs/contracts/linear-influence.md), [copy threshold boundaries](docs/contracts/copy-threshold-boundaries.md), and [decisions with declared losses](docs/contracts/decision-estimation.md). Rational Lean identities, conditional derivations and finite counterexamples have separate evidence classes. [Theory coverage](docs/contracts/theory-coverage.md) names the remaining obligations. [Research declarations](docs/contracts/research-evidence-register.md) are attributed records, not audited empirical results. T2 remains pending; no stochastic T2 recurrence or new empirical conclusion is asserted.

## The object

```text
c = ⟨⊥, ⊤, O, ⊑⟩        over L at r
⊥(c)                   = ⋁ required ∨ ⋁_{o∈O} lo_o
⊤(c)                   = ⋀ signed ∧ ⋀_{o∈O} hi_o
info(c)                ⟺ |ext(O)| ≥ 2 ∧ meet(c) ≠ ∅
F(C)                   = Σ_{c∈C} F(c),   F(a(c)) ≤ F(c) for every act a that narrows
A(c)                   = |Σ_{o∈O} s_o w_o e^{iφ_o}|²
⊤(c)                   = ⋀_{b ⊑ c} signed(b) ∧ ⋀_{o∈O} hi_o,   one line per act
|e^{ia} + e^{ib}|² < 2 ⟺ acos(cos(a − b)) > π/2
state(c)               ∈ {FREE, REQUIRED, FORBIDDEN, CONFLICT}
```

```text
bounds cross or claims have an empty meet  CONFLICT 
one origin                                 REQUIRED 
claims meet within bounds                  FREE     
claims meet outside bounds                 FORBIDDEN
```

```bash
npm install @lapxo/obligations
```


## Use the pure API

The package is ESM and requires Node.js 22.12 or later. It provides the algebra; it does not fetch evidence, choose trusted origins or sign declarations. Bound consumes this algebra to admit and resolve places.

```js
import { intervals } from '@lapxo/obligations';

const scale = intervals(0, 10);
console.log(scale.show(scale.meet({ lo: 2, hi: 8 }, { lo: 5, hi: 9 })));
// 5..8
```

Public entry points include:

| Entry point | Purpose |
| --- | --- |
| `@lapxo/obligations` | Cell algebra, declarations, forms and region operations |
| `/measures` | Model-bound information, confidence and error-history calculations |
| `/field`, `/encounter`, `/present` | Regions, observations, epochs and encounters |
| `/lattice`, `/forms` | Orders, intervals and alphabets |
| `/debit`, `/packed`, `/price` | Constraint operations, packed states and their price |
| `/signatures`, `/replay` | Projection of signed declarations and replay |
| `/shuffle`, `/views/field`, `/views/product` | Permutations and declared views |

### A model-bound calculation

```js
import { capacityBound } from '@lapxo/obligations/measures';

const bound = capacityBound(4, '1/5', { logarithm: 'binary64-log2' });
console.log(bound.value.toFixed(6), bound.unit);
// 1.683007 bits
```

This is an information upper bound under the declared single-dominant-factor model,
not a measurement of truth or proof of independent origins. The four states are unchanged.

For the separate, declared n-ary symmetric lineage channel with uniform truth and no extra truth access, h2(c) is a lower bound on residual truth uncertainty, not a ceiling on information. The full residual is h2(c) + c*log2(n-1); the corresponding information ceiling needs that symmetric channel and the report-only Markov bottleneck. This is the capacityP0 case, not a replacement for the capacityBound calculation above.

The parameter c has the meaning given by its selected mixture or channel model; it is not the genetic inbreeding coefficient F. Cell vacuity and missing delivered bytes are separate questions: a statement about a cell does not verify that an archive or provider exists and matches its digest. Their relationship remains a named tension.


## Theory and evidence in 0.4.6

The compiled API and algebra are unchanged from 0.4.5. This release adds contracts, proof sources, samples and executable vectors; these are not new runtime exports.

- **Conditional lineage models:** the finite M0 binomial bridge, diagonal prerequisites, population-moment identification and finite uncertainty retain their declared hypotheses. Identification requires known p and uniform lineage shares; arbitrary weights retain exact counterexamples.
- **M1 models:** the ancestor-first fixed-quota generator, off-diagonal limit and specified diagonal regions have Lean-checked results within their stated domains.
- **Projection chains:** deterministic X → Y → Z uses one common prior. The entropy identity has bounded executable evidence; it is not presented as a universal Lean proof.
- **Origins and participation:** named lineage, shared provenance and participation do not establish joint independence. Independence is a model hypothesis wherever consumed.

Read the [identification contract](docs/contracts/m0-moment-identification.md), [finite-uncertainty contract](docs/contracts/m0-keff-interval.md), [M1 regions](docs/contracts/m1-diagonal-regions.md), [projection-chain contract](docs/contracts/projection-chain.md) and [extension/lineage definitions](docs/contracts/extension-lineage-participation.md) for exact conditions and boundaries. Bound records admitted declarations and their evidence in `TARGET.bound` and `receipts.bound`.

### Open questions

General heterogeneous M0 and M1 diagonal central limit theorems, causal subgroup recovery, oracle-free reference, actual calibration, fixed-source quota uncertainty and a public K_eff interval API remain open. Conditional results do not close those demands. [Experiment 1a](docs/contracts/model-collapse-1a.md) supplies a protocol only: its empirical status is `unmeasured`, with no selected dataset or claimed experimental result.

## The paper

The theory here is not an application of an algebra to a problem. It is one algebra, of a cell with two marks, and three theories that turn out to be that algebra seen from different sides: constraints with a price, states on a scale, and points with an epoch and an origin.

What it proves is that the price of a fold, the freedom of a system in bits, the four states a verdict can hold, the spectrum a domain admits, the metric that shared observation induces and the phase an epoch carries are all consequences of the same lines. Runtime operations, mathematical statements and executable evidence have separate scopes. Their contracts name the assumptions and the evidence that support each claim; proof sources do not imply an exported implementation.

Ochoa, N. (2026). Two-Sided Constraints on a Valued Lattice (Version 1.0.0). Zenodo. https://doi.org/10.5281/zenodo.21858428

## Pointers

- [In phase](docs/learn/in-phase.md)
- [Measures](docs/measures.md)
- [Paper](docs/paper.md)
- [Price](docs/learn/price.md)
- [Reference](docs/reference.md)
- [Signature](docs/learn/signature.md)
- [Thermometer](docs/learn/thermometer.md)
- [Withdrawal](docs/learn/withdrawal.md)
