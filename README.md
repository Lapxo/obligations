<p align="center"><img src="docs/img/logo.svg" alt="Obligations: who, between floor and ceiling" width="96"></p>

<h1 align="center">@lapxo/obligations</h1>

<p align="center">An algebra for values that remember who said them.<br>
Floors, ceilings, origins and epochs — so disagreement, withdrawal and
"how many independent sources" are operations, not afterthoughts.</p>

<p align="center">
<img src="https://img.shields.io/badge/version-0.5.1-" alt="">
<img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="">
<img src="https://img.shields.io/badge/Lean-sorry--free-blue" alt="">
<a href="https://doi.org/10.5281/zenodo.21858428"><img src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21858428-" alt=""></a>
<img src="https://img.shields.io/badge/license-MIT-" alt="">
</p>

---

## What it does

The operative object is the obligatory cell over a declared lattice. It retains
attributed declarations and an **epoch**; its **floor** (what must hold) and
**ceiling** (what may hold) are derived views. Its operations include:

- **Meet** — what several origins hold *together*, or a visible conflict if they don't.
- **Exact withdrawal** — take back one origin's claim without touching anyone else's.
- **Alterity** — diversity and evidence readings under a declared similarity or probability model; origin names alone do not establish independence.
- **Replay** — the same history gives the same answer, at any epoch.

No database, no network, no signing. Zero runtime dependencies. Lean proofs
for what is proven, countermodels for what is refuted.

## Quick start

```sh
npm install @lapxo/obligations
```

```js
import { intervals, point, meetAt, origins } from '@lapxo/obligations';

const scale = intervals(0, 20);
const price = point('price', 0, [
  { origin: 'seller', span: { lo: 2, hi: 9 } },
  { origin: 'buyer',  span: { lo: 5, hi: 12 } },
]);

scale.show(meetAt(price)); // '5..9'  — what both hold
origins(price);            // 2       — named origins (not proof of two people)
```

Change the buyer to `{ lo: 10, hi: 12 }` and the intersection is empty.
The two declarations remain attributable; the algebra does not invent `9.5`.

## What you have today vs. what you get

| Today | With Obligations |
| --- | --- |
| Two sources disagree → last write wins, or an average | Conflict is a state; both claims stay, with who |
| "Delete the value 7" | Withdraw *seller's* 7; buyer's 7 is untouched |
| "10 sources agree" | "10 names; alterity 2.3 under this similarity model" |
| Logs you reconstruct by hand | Replay the declared history to an epoch |
| Trust the vendor's audit trail | Verify the algebra; proofs are in the repo |

## Why this is different

**1. Disagreement is a value, not an error.**
`(u₁,w₁) ∧ (u₂,w₂) = (u₁∨u₂, w₁∧w₂)`: combining declarations strengthens the
demand and tightens the limit. When they cannot both hold, the cell is in
`CONFLICT` — observable, attributable, resolvable. Nothing invents a number in
between.

**2. Who is kept per declaration, not per count.**
Under a declared finite probability model, replacing a configuration `X` by
its count `K` loses `V = I(Y; X | K)` bits about `Y`. `V = 0` exactly when
`Y` and `X` are conditionally independent given `K`. Different reliabilities
can make attribution informative; they do not alone prove positive loss.
This is why withdrawal names a declaration and why copies are grouped for
measurement but never merged.

**3. Measures declare what they measure.**
`D_max` (Leinster–Meckes) reads diversity from a declared symmetric similarity
matrix in `[0,1]`, with diagonal `1`. `N` reads normalized evidence from supplied
conditional laws and a named, oriented reference divergence. Their hypotheses,
units and numerical policies remain explicit. Neither is a probability of being
right, a count of authenticated people or authority to change a cell. A
second-order approximation and shared-cause identifiability require their own
model and conditions; finite evidence does not establish a universal guarantee.

**4. Every result keeps its hypotheses.**
A proof names its theorem and axioms. A refutation is one finite counterexample.
A measurement keeps its model and its status. Nothing is promoted by a metadata
field.

## Concepts in 60 seconds

```text
cell      = coordinate, epoch, attributed declarations and support on a lattice
floor     = R ∧ H      R: meet of requirements, H: meet of live claims
ceiling   = S ∧ H      S: active signed limit
state     ∈ { FREE, REQUIRED, FORBIDDEN, CONFLICT }
withdraw  : names a declaration; equal content is never the target
alterity  : D_max from similarity · N from conditional laws · L from a copy model
```

Lattices can be intervals, finite alphabets, information partitions or any
domain with the required order laws. Coordinates are supplied by the application.

## Entry points

| Import | Purpose |
| --- | --- |
| `@lapxo/obligations` | cell algebra, declarations, forms, regions |
| `/measures` | diversity, evidence, region measures, projection loss |
| `/field` `/encounter` `/present` | regions, observations, epochs, encounters |
| `/lattice` `/forms` | orders, intervals, alphabets |
| `/debit` `/packed` `/price` | constraint operations, packed states, price |
| `/signatures` `/replay` | projection of signed declarations, replay |
| `/views/field` `/views/product` | declared views |

ESM · Node.js ≥ 22.12 · TypeScript declarations included.

## What it does not do

It does not fetch evidence, choose trusted origins, sign declarations or decide
who may change what. Authentication, admission, storage and application policy
belong to the consumer. The algebra has no dependency on a particular host,
verifier or product.

## Evidence

- [Reference](docs/reference.md)
- [The obligatory cell](docs/contracts/cell-declaration.md)
- [Declaration provenance](docs/contracts/declaration-provenance.md)
- [Measures](docs/measures.md)
- [Valuation and residual information](docs/contracts/valuation-residual.md)
- [Exact withdrawal](docs/learn/withdrawal.md)

Ochoa, N. (2026). *Two-Sided Constraints on a Valued Lattice* (1.0.0). Zenodo.
[10.5281/zenodo.21858428](https://doi.org/10.5281/zenodo.21858428). Used under
its published hypotheses (Remark 1.1, Definitions 2.4 and 2.6, Proposition 2.5,
Theorem 2.8, Corollary 2.10).

MIT.
