<p><img src="docs/img/logo.svg" alt=""></p>

# @lapxo/obligations

![version 0.4.2](https://img.shields.io/badge/version-0.4.2-) ![license MIT](https://img.shields.io/badge/license-MIT-) ![node >=22.12](https://img.shields.io/badge/node-%3E%3D22.12-) [![DOI 10.5281/zenodo.21858428](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21858428-)](https://doi.org/10.5281/zenodo.21858428)

The algebra of a cell: two poles, origins with phase, eight acts.

## The idea

Every quantity a system answers for has two marks on one scale. The floor is what must hold, the ceiling is what may hold, and the pair is a cell. Two origins that touch one cell and whose marks meet make information; two whose marks do not meet make a fork that no average can close.

Four words carry the whole library. A floor, a ceiling, an origin and an epoch. A price is the distance between the marks, a state is where they stand, a verdict is what an origin found, a horizon is what no origin has reached, and none of them is a new idea: each is read off those four.

The pure API `@lapxo/obligations/measures` describes error histories of origins: covariance, spectrum, effective rank and common variance. It ships M/3 as the reference conditional model with an exact rational evaluator. No measure changes a state; observed association never establishes independence. [Measures](docs/measures.md).

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


## A model-bound calculation

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


## The paper

The theory here is not an application of an algebra to a problem. It is one algebra, of a cell with two marks, and three theories that turn out to be that algebra seen from different sides: constraints with a price, states on a scale, and points with an epoch and an origin.

What it proves is that the price of a fold, the freedom of a system in bits, the four states a verdict can hold, the spectrum a domain admits, the metric that shared observation induces and the phase an epoch carries are all consequences of the same lines. Each law names the view that implements it, and each view is a folder of the source: what is proved in the field view runs in the field view, and a law no operation reaches is a law this package refuses to claim.

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
