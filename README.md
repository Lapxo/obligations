<p align="center"><img src="docs/img/logo.svg" alt="Attributed declarations with a shared intersection" width="96"></p>

<h1 align="center">Obligations</h1>

<p align="center">An algebra of requirements, permissions and attributed declarations.</p>

A requirement says what must hold. A permission says what may hold. A declaration carries both sides, together with the origin that supplied it. Obligations makes their conjunction, disagreement, refinement and withdrawal explicit, so a result can retain what supports it instead of replacing its sources with a single number.

The operative object is the obligatory cell over a declared lattice. The lattice supplies the order and operations; the cell retains its declarations, support and epoch. The same structure can describe intervals, finite choices, information partitions or any domain with the required order laws.

## Quick start

Install the dependency-free runtime on Node.js 22.12 or later:

```sh
npm install @lapxo/obligations
```

```js
import { intervals, point, meetAt, origins } from '@lapxo/obligations';

const scale = intervals(0, 20);
const cell = point('capacity', 0, [
  { origin: 'seller', span: { lo: 2, hi: 9 } },
  { origin: 'buyer', span: { lo: 5, hi: 12 } },
]);

console.log(scale.show(meetAt(cell))); // 5..9
console.log(origins(cell));           // 2
```

The intersection reports what these declarations hold together. It does not authenticate either party or establish two independent causes. Disjoint claims remain a disagreement rather than a price invented between them.

## What it preserves

| Operation | What remains explicit |
| --- | --- |
| Combine declarations | Both the demand and the limit, with their origins |
| Read disagreement | The incompatible constraints, rather than a replacement value |
| Withdraw a declaration | Its identity; another origin's equal content remains |
| Replay acts | Their declared order, epoch and exact withdrawal targets |
| Measure a projection | Its model, unit, prior and numerical assumptions |

## Requirements and permissions

Write a declaration as a pair `(u, w)`: a demanded level and a limiting level on a supplied scale. Combining declarations must account for both poles. On a lattice, conjunction and disjunction are:

```text
(u₁, w₁) ∧ (u₂, w₂) = (u₁ ∨ u₂, w₁ ∧ w₂)
(u₁, w₁) ∨ (u₂, w₂) = (u₁ ∧ u₂, w₁ ∨ w₂)
```

Conjunction strengthens the demand and tightens the limit. Disjunction does the dual. A conflict remains observable when the two sides cannot be satisfied together. It is not silently replaced by an average, a default or whichever declaration arrived last.

Meet and join belong to the declared domain. For intervals, meet is intersection and join is the smallest enclosing interval, with every empty interval representing the same bottom element. A finite alphabet supplies its own order; it is not assumed to support operations that have not been defined and checked.

## The cell and its support

A cell has a coordinate, an epoch, attributed claims and a `restsOn` relation. Requirements and signed limits are marks on that structure. Its floor and ceiling are derived views, not independent stores that can drift apart.

Let `R` be the meet of the active requirements, `S` the active signed limit, and `H` the meet of the live claims. The two poles read:

```text
floor   = R ∧ H
ceiling = S ∧ H
```

A dependency carries only the constraints declared to travel through it. A witnessed widening applies where it was witnessed; it does not silently widen dependent cells. Cycles in the support relation refuse instead of producing an arbitrary traversal result. The set of coordinates is supplied by the application, not built into the algebra.

The library distinguishes an unresolved requirement, a free cell, a forbidden cell and a conflict. These states depend on the declared bounds and live origins. A count of origin names is an extensional property: it does not prove that those origins are authenticated or causally independent.

## Who said it

Two equal values from different origins remain two attributed declarations. A projection may group copies for measurement, but must preserve their identities when explanation or withdrawal needs them.

A withdrawal names the declaration it takes back. Equal content is insufficient to choose a withdrawal target: retiring one declaration must not erase another origin's equal declaration. History and epoch make the change replayable. Removing a measurement weight is likewise not an act of withdrawal.

Authentication and admission are separate responsibilities. The algebra can retain an origin or verify a supplied mathematical relation; an application decides which keys, evidence and policies authorize a change. Neither a confidence score nor a diversity measure grants that authority.

## Valuation and information

A valuation assigns a quantity to elements of a declared lattice under explicit mathematical hypotheses. This gives several readings of the same two-sided structure: the cost of violating a bound, the remaining freedom on a finite scale, or the information lost under a projection.

The quantity is meaningful only with its domain, unit, prior and numerical policy. Bits, probability, similarity diversity and a KL ratio are different readings. There is no universal numerical scale that combines them without a declared model.

For finite information variables, the authorship reading is `V = I(Y; X | K)`: the information in a configuration `X` about truth `Y` that its count `K` does not retain. Zero means conditional independence of `Y` and `X` given `K`, not exchangeability. A residual-information correspondence requires its stated support and valuation hypotheses. Mutual information is not generally submodular; the XOR counterexample prevents assuming otherwise.

The measures API also provides:

- Similarity diversity over a declared symmetric matrix with entries in `[0,1]` and diagonal `1`. Covariance is not silently converted into similarity. A diversity-maximizing allocation does not necessarily minimize decision error.
- Oriented normalized evidence from supplied conditional laws and a named reference divergence. Missing reference or support assumptions are not replaced by an inferred model.
- Finite region measures over declared atomic support. Disjoint support permits addition; overlapping selectors do not establish it.
- Projection loss under a common prior and an explicit mapping or channel. Arbitrary projections do not become a chain merely because their outputs have similar shapes.

Every result retains its hypotheses. A finite counterexample can refute a universal claim; a finite collection with no counterexamples does not establish one.

## Resolution, time and replay

A resolution declares which distinctions a reading preserves. Coarsening can merge distinctions, so any claim that a verdict survives must be checked against that verdict and projection. Greater resolution alone does not add evidence or independent origins.

An epoch identifies the history being read. Replay applies the declared acts and exact withdrawals, preserving their identities. Dependency, origin, epoch and resolution answer different questions and remain separate inputs.

## API

| Import | Purpose |
| --- | --- |
| `@lapxo/obligations` | Declarations, cells, finite orders, fields, replay and valuations |
| `/lattice`, `/forms` | Supplied orders, intervals and finite alphabets |
| `/field`, `/encounter`, `/present` | Coordinates, observations, origins and epochs |
| `/debit`, `/packed`, `/price` | Constraint operations and finite representations |
| `/signatures`, `/replay` | Mathematical projection of signed marks and replay |
| `/views/field`, `/views/product` | Declared views |
| `/measures` | Diversity, evidence, region measures and projection loss |


The root export includes declarations, forms, finite order checks, fields, replay and valuation operations. Focused subpaths include `lattice`, `forms`, `field`, `encounter`, `debit`, `price`, `signatures`, `views/field`, `views/product` and `measures`. TypeScript declarations ship with the JavaScript runtime; no runtime package dependencies are required.

The runtime performs no network requests or cryptographic signing and requires no database or key store. Applications supply their own authentication and admission policy.

## Theory and verification

The source repository contains written arguments, fixed countermodels, executable tests and Lean proofs. Each has a distinct scope. A bibliographic theorem retains its citation; a formal proof identifies its theorem and axioms; an empirical report retains its model and evidence status. Missing evidence stays missing, and no metadata field promotes a report to a proof.

Lean and verification fixtures are outside the npm runtime package.

## Read further

- [Reference](docs/reference.md)
- [The obligatory cell](docs/contracts/cell-declaration.md)
- [Declaration provenance](docs/contracts/declaration-provenance.md)
- [Measures](docs/measures.md)
- [Valuation and residual information](docs/contracts/valuation-residual.md)
- [Exact withdrawal](docs/learn/withdrawal.md)

Ochoa, N. (2026). *Two-Sided Constraints on a Valued Lattice*. [DOI: 10.5281/zenodo.21858428](https://doi.org/10.5281/zenodo.21858428). The declaration algebra and valuation results are used under their published hypotheses, including Remark 1.1, Definition 2.4, Proposition 2.5, Definition 2.6, Theorem 2.8 and Corollary 2.10.

MIT license.
