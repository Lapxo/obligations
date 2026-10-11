<p><img src="docs/img/logo.svg" alt=""></p>

# @lapxo/obligations

![version 0.4.0](https://img.shields.io/badge/version-0.4.0-) ![license MIT](https://img.shields.io/badge/license-MIT-) ![node >=22.12](https://img.shields.io/badge/node-%3E%3D22.12-) ![cases 0 hold](https://img.shields.io/badge/cases-0_hold-) ![verify none](https://img.shields.io/badge/verify-none-) [![DOI 10.5281/zenodo.21858428](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21858428-)](https://doi.org/10.5281/zenodo.21858428)

The algebra of a cell: two poles, origins with phase, eight acts.

## The idea

Every quantity a system answers for has two marks on one scale. The floor is what must hold, the ceiling is what may hold, and the pair is a cell. Two origins that touch one cell and whose marks meet make information; two whose marks do not meet make a fork that no average can close.

Four words carry the whole library. A floor, a ceiling, an origin and an epoch. A price is the distance between the marks, a state is where they stand, a verdict is what an origin found, a horizon is what no origin has reached, and none of them is a new idea: each is read off those four.

# Measures beside the states

The pure API @lapxo/obligations/measures does not change FREE, REQUIRED, FORBIDDEN or CONFLICT. Observed association never establishes independence.

## Descriptive contract
errorMatrix takes explicit binary event/origin/error rows and minCells >= 2. Identical redelivery is idempotent; conflicting observations refuse; incomplete shared events are unmeasured. covariance is population covariance of the handed rows, divided by their event count. participationRatio describes effective rank; zero variation is unmeasured.

spectrum requires absolute, relative and maxRotations. Asymmetric or materially non-PSD matrices refuse. commonMass is the largest observed variance fraction, not a probability of false agreement. loadings require an isolated top eigenvalue; repeated eigenspaces have no unique top loading. commonMassOf requires an explicit cutoff and whole eigenspaces. The unanimity no-sample prints observed commonMass >= 0.5 beside FREE, without claiming strength.

descentCount counts distinct proper descendants in a declared restsOn graph. Identical edges add nothing. Missing declarations remain unmeasured; duplicate node declarations and cycles refuse. Declared descent is not observed activity or independence.

## Controlled procedures
unanimityFloor and unanimityThreshold implement the declared T1 special case. With P_k=(1-c)p^k(n-1)^(1-k), F_k=(c+P_k)/(c+P_k+(1-c)(1-p)^k). For nondegenerate parameters, F_(k+1) >= F_k iff p*c >= (1-p-p/(n-1))*P_k. The c=.01,p=.1,n=2 no-sample decreases before k=3; its threshold is 3. dissentExperiment and interestExperiment report conditional counts under explicitly handed generators: xorshift32, nonzero seed and trial count. Their denominators are events and falseEvents, and zero events are unmeasured. Interest is an explicitly handed bias toward one wrong value, not inferred from a missing observation. E3: a school answers truth with probability q, otherwise its own wrong value. These are controlled procedures, never laws or state changes.

## Native publication evidence
observations, spectrum, unanimity and descent each have yes/no cases in samples/measures/<group>.json and installed-instrument captures in vectors/measures/<group>.cli.json. M/3 has samples/measures/m3.json and vectors/measures/m3.cli.json. Each vector ran on two independent places, repeated the positive reading byte-for-byte and refused its negative by name. State-preservation tests compare all four actual algebraic states before and after measurements.

## Model boundary
M/3 below is the only reference model. The older descriptive D/commonMass and independence claims are superseded. modelRequired returns unmeasured for an absent model; no measurement silently supplies a causal model. Factor attribution, dissent and probe results are conditional on M/3's handed parameters, not empirical independence certificates.

# obligations 0.4.0 — model M/3 (authoritative contract)

M/3 is the reference conditional model shipped beside the descriptive measures. Every M/3
result carries `model=M/3`, its handed parameters and its conditions. The descriptive
measures are independent of M/3. Nothing changes a state. This document supersedes all
earlier M/1, M/2 and amendment texts.

## 1. Definition
Witnesses W (unique identifiers); cells with truth t and integer cardinality n ≥ 2;
factors F, each with unique identifier, sharing set a_f ⊆ W, firing probability c_f and a
unique declared index (total order); private error probability p_w for every witness
involved. Per cell, independently:
1. each factor fires independently with probability c_f;
2. a witness is governed by the fired factor containing it with the lowest index, if
   any; otherwise its private error fires with probability p_w;
3. labels: each fired governing factor is a factor label; each privately erring witness
   is a private label (namespaces are distinct: a factor label and a private label can
   never merge even with identical identifier strings); every label draws one wrong
   value uniformly from the n−1 wrong values; draws of distinct labels are mutually
   independent and independent of all firing and private indicators; everyone else says t.
Singleton factors (|a_f| = 1) are retained in declared order; the generator is never
normalized.

## 2. Validation (refuse by name)
S ⊆ W and S nonempty; every a_f ⊆ W; unique witness and factor identifiers; unique factor
indices; c_f, p_w ∈ [0,1]; n integer ≥ 2; an explicitly handed p_w for every witness in
S and in every sharing set touching S; a sharing set with duplicate members is refused.

## 3. Exact evaluator
Enumerate fired subsets of the factors touching S (2^|touching|) and private patterns of
ungoverned members of S (2^|free|). In each configuration, erring witnesses are grouped by
label; L = number of labels; weights = witnesses per label. Collisions of wrong values
follow set partitions π of the labels with
P(π) = (n−1)^{↓|π|} / (n−1)^L (falling factorial), and P(π) = 0 when |π| > n−1.
Each partition yields block totals; unanimity ⇔ no correct witness and one block;
majority = strictly more than |S|/2 witnesses on one value; ties and pluralities ≤ half
are "no majority".
Exactness: all c_f, p_w are handed as rationals (or decimal strings converted exactly);
accumulation is in rational arithmetic; displayed decimals are rounded half-even to a
declared number of digits. Budget: before any work, compute
work = Σ_configurations Bell(L) ≤ `evaluator/budget` (declared); if exceeded, return
`unmeasured` with cause `evaluator/budget` and no partial accumulation.
Outputs per (S, x): P_true, P_false (false unanimity), P_fired (false unanimity with some
touching factor fired), P_dissent = 1 − P_true − P_false (identity, asserted),
maj_true∧dissent, maj_false∧dissent, maj_none∧dissent (exclusive, sum = P_dissent).
Closed form admitted only for P_true = Π_{f touches S}(1−c_f) · Π_{w∈S}(1−p_w).

## 4. Quantities and denominators
```
Φ   = P_false / (P_true + P_false)        false-unanimity share
D   = P_fired / (P_true + P_false)        factor-attribution share
reliability = 1 − Φ, labelled "P(correct | unanimous) under M/3 with handed parameters"
P(false maj | dissent)            = maj_false∧dissent / P_dissent
P(false maj | any maj ∧ dissent)  = maj_false∧dissent / (maj_true∧dissent + maj_false∧dissent)
```
A ratio with zero denominator is `unmeasured` with cause; a zero numerator over a positive
denominator is a measured 0. Φ − D is private coincidence; 1 − D is never reliability.

## 5. Dissent
Theorem: if a factor covering S fires and no fired factor of lower index touches S
partially, S is unanimous; disagreement inside S certifies this configuration did not
occur — nothing more. False majorities under dissent remain possible through partial
factors and are reported through the two conditionals above. T1 and T5 stay controlled
experiments with declared PRNG, seed, trials and denominators (T5 uses the second
conditional).

## 6. Probe update
For a witness u private-only and independent of every factor touching S (or, with its
total marginal error probability, labelled so):
```
a = Φ · p_u/(n−1);  b = (1−Φ)·(1−p_u);  Φ′ = a/(a+b);  unmeasured iff a+b = 0
```
Strict improvement Φ′ < Φ holds for 0 < Φ < 1 iff p_u < (n−1)/n; boundary cases are
valid (Φ=0, p_u=0.2 → 0; Φ=1, p_u=0.2 → 1; p_u=1 → 1).

## 7. Identification and fitting
Let, for each witness w,
```
r_w = (1−p_w) · Π_{singleton f ∋ w} (1−c_f)        unresolved singleton/private survival
s_w = r_w · Π_{shared f ∋ w} (1−c_f)                total correctness probability
s_uv = P(e_u = 0 ∧ e_v = 0)
```
Population identification (declared sharing sets, s_u > 0 for every involved witness):
log(s_uv/(s_u·s_v)) = Σ_{shared f ∋ u,v} −log(1−c_f) is linear in −log(1−c_f); if the
pair × shared-factor system has full column rank, every shared c_f is identified, and then
r_w from s_w; r_w's decomposition into p_w and singleton c_f is unresolved by error data.
Structure is never discovered by a measure. Finite-data fitting is a separate declared
procedure: constrained least squares on the log system, declared budget, residual
diagnostics against a declared tolerance, bootstrap uncertainty with declared B/seed/PRNG,
pooling only under declared parameter compatibility; no pseudocounts, no clamping, no
promotion of fitted structure; zero joint-correct counts or incompatible moments →
`model/M misfit`, no c_f reported. Φ and D are reported only with handed parameters and
labelled `handed`, never `fitted`.

## 8. Time, stake, commonMass
Freshness and interest enter only as hypothetical factors with declared firing
probabilities; otherwise annotations and `unmeasured`. Descriptive commonMass is read as
excess over 1/|S| only as deviation from the equal-variance independent reference; it
never identifies dependence.

## 9. Captured vectors (exact; rational reference; decimals rounded half-even, 8 digits)
- two witnesses, covering c=1/20, p=1/5, n=64: P_true 0.608, P_false 0.05060317,
  P_fired 0.05, P_dissent 0.34139683, Φ 0.07683409, D 0.07591825.
- impossible conditioning (no factors, p_A=0, p_B=1): P_true = P_false = 0, P_dissent 1,
  Φ, D unmeasured (cause: no unanimity mass).
- three witnesses, covering {A,B,C} c=1/5 idx 0, partial {A,B} c=3/10 idx 1, p=0:
  P_true 0.56, P_false 0.2, P_dissent 0.24, maj_false∧dissent 0.24, Φ = D = 0.26315789,
  P(false maj | dissent) = 1, P(false maj | any maj ∧ dissent) = 1.
- earlier singleton {A} c=3/10 idx 0, covering {A,B} c=1/5 idx 1, p=1/5: Φ 0.28387293,
  D 0.28316249, P_dissent 0.49953016; merged-singleton no-sample Φ 0.35944805.
- four witnesses, factors {0,1} and {2,3} each c=1/2, p=0: P_dissent 47/63 = 0.74603175,
  maj_none∧dissent 47/63, P(false maj | dissent) = 0 (measured), P(false maj | any maj ∧
  dissent) unmeasured (no majority mass), Φ = D = 1/64.
- probe (Φ 0.07683409, n=64): p_u=0.2 → 0.00033; 0.98 → 0.06080; 0.99 → 0.11566; 1 → 1;
  Φ=0,p_u=0.2 → 0; Φ=1,p_u=0.2 → 1.
- identification: c=1/5, p_A=1/2, p_B=3/8 → c recovered exactly 1/5; (c=1/5,p_A=1,
  p_B=3/8) vs (c=2/5,p_A=1,p_B=1/6) have identical moments → s_A = 0 → unidentified.
- identity 1 − P_true − P_false = P_dissent holds in every case.

## 10. Open, by name
Partial value sharing (a factor firing without forcing one value) — a future model;
probe usefulness beyond the private-only case; discovery of sharing structure (never by a
measure); adequacy policies (min cells, interval widths, budgets) as declared lines.

## 11. Acceptance
TypeScript implementation reproduces every captured vector exactly in rational
arithmetic; validation refuses by name; budget is computed before work; every result
carries model, handed parameters and conditions; states identical before and after;
the descriptive 0.4.0 measures and all algebra hashes unchanged.

## The object


```text
bounds that crossCONFLICT
one originREQUIRED
claims that meet and fit the boundsFREE
claims that meet outside the boundsFORBIDDEN
```

```bash
npm install @lapxo/obligations
```

## The paper

The theory here is not an application of an algebra to a problem. It is one algebra, of a cell with two marks, and three theories that turn out to be that algebra seen from different sides: constraints with a price, states on a scale, and points with an epoch and an origin.

What it proves is that the price of a fold, the freedom of a system in bits, the four states a verdict can hold, the spectrum a domain admits, the metric that shared observation induces and the phase an epoch carries are all consequences of the same lines. Each law names the view that implements it, and each view is a folder of the source: what is proved in the field view runs in the field view, and a law no operation reaches is a law this package refuses to claim.

Ochoa, N. (2026). Two-Sided Constraints on a Valued Lattice (Version 1.0.0). Zenodo. https://doi.org/10.5281/zenodo.21858428

## Check

 0 cases hold

## Pointers

- [Measures](docs/measures.md)
- [Paper](docs/paper.md)
- [Reference](docs/reference.md)
- Learn from an example: [in phase](docs/learn/in-phase.md), [price](docs/learn/price.md), [signature](docs/learn/signature.md), [thermometer](docs/learn/thermometer.md), [withdrawal](docs/learn/withdrawal.md)
