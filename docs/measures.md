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

## 12. Capacity under a single dominant factor

`capacityBound`, `capacityP0`, `mutualInformation`, and `unanimityNoFactor` use the declared single-dominant-factor model. T is uniform on n >= 2 values. F is independent of T with probability c. On F=1 all witnesses report one W, uniform among values different from T. On F=0 they use independent homogeneous private channels: correct with probability 1-p, otherwise uniform among n-1 wrong values. These hypotheses are handed, never inferred.

For every positive k, I(T;V) <= log2(n)-c*log2(n-1). The entropy chain rule gives
H(T|V) = c*log2(n-1) + (1-c)*H(T|V,F=0) + I(T;F|V).
The first term is exclusion uncertainty, the second private uncertainty, the third factor ambiguity. A decoder cannot increase information about T.

For 0<p<1 and p!=(n-1)/n, the bound is attained as k tends to infinity: the empirical private vote distribution distinguishes T, and private unanimity has probability (1-p)^k+p^k/(n-1)^(k-1), tending to zero. For p=1,n>2 the missing value identifies T asymptotically. For p=1,n=2 every vote is the complement of T, giving one bit for every k. At p=0, I=log2(n)-h(c)-c*log2(n-1) for every k. At c=1, I=log2(n/(n-1)) for every k. At c=0 the uninformative private channel p=(n-1)/n gives zero for every k; c=0 does not by itself imply log2(n). At that uninformative p with a factor, the limit is c*log2(n/(n-1)), not the general upper bound.

Probabilities and the conditional-entropy expression are exact rationals. Numerical entropy uses the explicitly handed `binary64-log2` policy, in bits, and is an approximation; it is not an exact rational logarithm. `mutualInformation` declares its joint-cell enumeration budget before work. `unanimityNoFactor` declares a rational-bit upper-bound budget before exponentiation. Budget exhaustion is unmeasured, never zero.

Captured finite information, n=4,c=1/5,p=3/10: k=1,2,4,7 gives approximately 0.313028978, 0.469712906, 0.914458010, 1.332321771 bits. The bound is approximately 1.683007500 bits. At p=0 the information is approximately 0.961079405 bits for every k. These decimals are illustrative approximations under the named policy.

## 13. Decision results are separate

`decisionInformation` accepts `plurality-uniform-ties@1` or `posterior-map-uniform-ties@1`. The second compares exact declared joint probabilities for finite k; it does not apply an intuition-based unanimity threshold. Ties are uniformly distributed among maximizers. It returns posterior information I(T;V), decision information I(T;answer), and exact rational decision accuracy as distinct quantities. The exact T/answer joint table accompanies them. A randomized answer cannot gain information over V.

Under p<(n-1)/n, asymptotically plurality emits the forced wrong value on the factor event. Posterior MAP identifies that event and samples uniformly among its n-1 alternatives. For n=4,c=1/5, plurality decision information is approximately 0.961079405 bits; MAP decision information is approximately 1.222162 bits; posterior information is approximately 1.683007500 bits. The two information gains differ. None is a finite-k or model-free guarantee.

## 14. No-truth fitting

`fitUnanimityModel` uses `exact-c-slices-on-declared-p-grid@1`. It takes one named lineage, cardinality, k/count/denominator rows, a declared p grid, exact absolute rate tolerance, and a work budget. For each handed p it intersects the exact inequalities for c, returning the entire compatible c interval and midpoint residual diagnostics. No claim is made about p values between slices or continuous identification. A measured fit means the declared procedure was evaluated; it does not mean parameters or causes were identified.

The observed rate is compared with c+(1-c)*[(1-p)^k+p^k/(n-1)^(k-1)]. Binary p versus 1-p ambiguity remains visible. Perfect unanimity leaves p=0 and c=1 indistinguishable. Too few informative sizes or no compatible slice are explicitly unmeasured. Mixed populations require a separately declared mixture model and are not pooled here.

Optional bootstrap samples complete paired groups across sizes with a handed xorshift32 seed, B and random-word budget. It retains the full compatible regions in each replicate, not independent uncertainty intervals for each size. Groups are the declared resampling units; the procedure assumes exchangeable independent groups and does not establish that assumption. Counts alone leave uncertainty unmeasured. Replicate regions are empirical bootstrap output, not guaranteed confidence sets. Exhausted random words never produce successful uncertainty.

## 15. False coincidence relative to a declared reference

`coincidenceExcess` takes event/origin/value rows, truth rows (`kind=truth`), an explicit selection S and the `independent-uniform-wrong@1` reference. Order h is |S|; identity and redelivery never add origins or events. Values belong to the declared alphabet. Conflicting values or truth refuse. Incomplete shared events and insufficient declared event counts remain unmeasured. Imperfect probes need a separate contract and are not silently accepted as truth.

The reference uses handed error marginals, or explicitly estimated marginals stratified by observed truth. For handed homogeneous errors p_i, reference false coincidence is product(p_i)/(n-1)^(h-1). Estimated strata use their event weights, never a pooled error probability that confounds truth populations. Output contains the false-coincidence count, denominator, exact observed and reference rates, signed delta=observed-reference, and ratio=observed/reference. Delta is never floored at zero. At reference zero the ratio is unmeasured, while counts and delta remain available. No sampling design is inferred; uncertainty is separately unmeasured.

A ratio greater than one means more coincidence than this reference, not a discovered common cause. Nonuniform wrong labels can exceed the uniform reference with independent witnesses. Independent errors with one shared wrong label give ratio (n-1)^(h-1): at n=64 this is 63 for pairs and 3969 for triples. The fair-bit XOR vector explicitly assigns one common wrong label: pairs have ratio 63, triples ratio zero and a negative delta. Indicators alone do not define the reported-value vector.

Under the separately handed dominant-factor model c=1/10,p=1/5,n=64, observed error marginals are 7/25. Relative to those marginals, delta at orders 2 and 3 is approximately 0.099326984 and 0.099996283. Its convergence to c is a conclusion under this model, never model-free identification.

## 16. Research demands and boundaries

The spectrum summarizes covariance of binary error indicators. It is not a sufficient statistic of reported values, closure events or independence. False-unanimity excess summarizes one event and does not replace the full joint distribution. Higher-order closure statistics need a declared closure rule and the appropriate joint law of reported values given truth; neither is inferred from a form name.

Helly is a property of a declared geometric family, not a probabilistic independence order or a truth guarantee. Geometry, factor precedence, partial label sharing, reproduction, percolation, time-varying fitting, imperfect-probe identification and model-free capacity remain explicitly open until their models, procedures and falsifiers close. Controlled experiments live in a world. No new origin, permission, algebraic amount or state is created by a measure.

## 17. Publication and stability

The historical nine publication groups are linked to their contracts, yes/no data and declared Bound 0.1.7 captures in two places. The 0.4.2 operations below require new captures under their selected reader; historical implementation-bound receipts do not cover changed bytes. Validation readers are maintained TypeScript worlds with ordinary modular compilation; no .mjs bundle or private executor ships in this library. Their implementation inventory is retained once by digest. The installed archive must expose the same public exports, preserve the four states, match all published bytes and close native receipts without a private store. Declaring these requirements does not pay them.

## 18. Declared failure bounds

`unionBoundConfidence(failures)` requires distinct nonempty IDs, explicit rational probabilities in [0,1], and nonempty justification references. The caller must establish every failure bound in one probability space. References are retained, not verified. The returned lower bound for all events succeeding is max(0,1−Σp_i), with exact rational arithmetic. The empty family gives 1; Σp_i≥1 gives the trivial bound 0. No independence, truth probability, or algebraic state is inferred.

`tolerantCountConfidence(failures,k)` requires a safe integer 0≤k≤m. For k<m it bounds failure by min(1,min_{0≤j≤k}(Σ of the m−j smallest p_i)/(k+1−j)); its exact success lower bound is the complement. For k=m success is certain. For m=3,k=1 and all p_i=1/10 the result is 17/20, not an inferred success rate. The distinct subset-intersection guarantee gives the weaker bound 7/10. Three disjoint paired failures among six events, each pair having probability 1/10, refute the former 4/5 claim: success is 7/10.

These operations compute conditional probability bounds. They select neither a geometric tolerance nor a consumer policy. Count-tolerant intersection T_k and widened-interval intersection T_eps remain named forms; tolerant-choice remains open.

## 19. Declared covering cause

`commonCauseCapacityBound(n,c,q,{logarithm:'binary64-log2'})` requires integer n≥2 and explicit rational c,q in [0,1]. Truth is uniform; the covering-cause indicator is independent of truth; when active, every report copies one symmetric channel with accuracy q. The inactive private channel is unrestricted. Revealing the indicator gives the upper bound log2(n)−c[h(q)+(1−q)log2(n−1)] in approximate bits. Copy count is no input. This is neither finite-sample mutual information nor an achievability claim.

At n=4,c=1,q=1/4 the bound is exactly zero; q=0 gives log2(4/3), and q=1 gives two bits. Missing q refuses. The operational declaration or detection of activation remains open in identification.model. Unconditioned coincidence does not identify q.

M/3 and M/4 retain their existing definitions. Partial-factor governance proposals do not supply a conditional joint observation and selection law. The information carried by dissent, including a bottom symbol, is open for those unspecified proposals.

## Obligations 0.4.3 — proposed conditional measures

L7: conditional bound on one declared common probability space: P(N>k)<=min(1,sum over |S|=k+1 of min p_i), with rational declared marginal failure upper bounds and 0<=k<=m. Trivial iff computed upper bound is one. Counterexamples refute the former top-k+1 success guarantee. Joint-independent Bernoulli convolution is a separate declared hypothesis; rho=0 and pairwise independence do not supply it. Existing stronger 0.4.2 count bound is unchanged and needs no joint independence.

L8: law by enumeration only for 3<=n<=64, positive integer divisors p|n and integer 0<=s<p. D=log2(n/p)-h(s/p), explicit binary64-log2 approximation. Odd-period minimum uses h(floor(p/2)/p), even-period minimum uses one. Complete maximum at zero; nonzero domain has endpoints 1,p-1, empty when p=1. No information or worst-case interpretation follows from nonnegativity. T87 retains its separate wrapped-phase amplitude identity.

L9: law by counterexample of existence of noninjective weighted mix, and measure with a declared prior on a finite explicitly supplied set of named-factor configurations. Equal-weight ab and ba give the same bottom tie and different named forks. Loss is H(configuration | mix)=H(configuration)-H(mix); a uniform prior must be explicitly selected, absent prior is unmeasured. The four-state uniform example has mean loss 0.5 bits and one bit conditioned on tie; the injective named fork has zero loss. Defines no new algebraic act, governance selection, M/3 or M/4 law, or destroyed field.

## Lineage and delivery: distinct scopes

For n>=2, uniform truth X, the declared n-ary symmetric channel X->Z with crossover probability c in [0,1], and X->Z->reports->aggregate A,

```text
H(X|Z) = h2(c) + c*log2(n-1) >= h2(c)
H(X|A) >= H(X|Z)
I(X;A) <= log2(n) - h2(c) - c*log2(n-1)
```

Here h2 is binary entropy, with 0*log2(0)=0. The uncertainty floor and information ceiling follow from this symmetric-channel equality and the declared Markov bottleneck. The reports and aggregation have no additional access to truth or a revealed error/cause indicator. This reuses capacityP0; it neither replaces capacityBound nor changes M/3 or M/4. An error rate alone, an asymmetric channel or the existing private-error model does not establish this ceiling. The distinguishing counterexamples and relation to F1 are in [the conditional lineage contract](../proofs/lineage-ceiling.json).

The parameter c denotes the mixture activation or channel crossover specified by the selected model. It is not identified from unanimity without that model, and no equality with the genetic inbreeding coefficient F is asserted. No genetic law follows here.

Cell vacuity is a property of a region under the algebra. Delivery asks whether the bytes named by a digest are available and match it. A vacuous cell neither certifies delivery nor proves that a delivered package is admissible. The relation between these predicates remains the named vacuity-versus-delivery tension.
