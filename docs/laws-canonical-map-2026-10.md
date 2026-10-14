# Canonical law map · 2026-10

Documentation map only. Proposed tests are not executed tests, receipts or theorem closures. No laws, vectors, relabels, rendered documents, releases or Bound changes.

Base: `c8f07ea6034d174a239c30e742bf8bf80d69b55f` (theory); original 0.4.1 base: `7fd489c21ab362034f164577a97bcb7d9965ad89`.
Theory SHA-256: `eb6223a3a83af20bf7e8f37d8808a87967746570a91a67971984832561ebdc56`. Full exact wire lines and hashed reference inventory are retained in the JSON companion.

## Status and limits

- Mechanical verification establishes source fidelity and map structure only; it does not prove proposed laws or semantic completeness.
- Theory attribution of independent browser/WebAssembly origins is retained author text, not independently verified here. No proof independence claim.
- A7/T90 and A9/T99 replacement undefined; factor governance and L7 conditional/total interpretation remain open.
- T87 near-phase objective/domain remains open; H3/H5 experiment relabel needs dependent reference review.

| ID | Historical name | Source line | Status |
|---|---|---:|---|
| T12 | T12-reliability-is-encounter-rate | 56 | defined proposal; implementation pending |
| T18 | T18-freedom-is-a-currency | 59 | defined proposal; implementation pending |
| T38 | T38-origins-are-a-polygon | 72 | defined proposal; implementation pending |
| T87 | T87-the-quarter-turn | 127 | open; domain and optimization objective unconfirmed |
| A7 | A7-freedom-conserved | 10 | open; replacement undefined |
| T90 | T90-freedom-is-entropy | 130 | open; replacement undefined |
| A9 | A9-everything-is-a-bound | 9 | open; replacement undefined |
| T99 | T99-the-fold-is-total | 136 | open; replacement undefined |
| H3 | H3-a-distant-signature-moves-a-cell-that-did-not-move | 88 | open; relabel decision and dependent-reference review pending |
| H5 | H5-hilbert-is-the-obligatory-without-four-fields | 94 | open; relabel decision and dependent-reference review pending |

## T12 · T12-reliability-is-encounter-rate

Current kind: `theorem`; historical scope: `law/T12-reliability-is-encounter-rate`.
Source: `src/laws/laws.bound:56`; line SHA-256: `77f04d46446dbe2e78db8cf9a5318f47e2c485825b1da774d5d65a878be0f660`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> the fraction of a domain's claims that are facts equals its second-origin rate; drift and surviving falsehood are its complement

| Acta field | Proposal / record |
|---|---|
| Status | defined proposal; implementation pending |
| Basis | L6/F5 |
| Proposed replacement | Information about truth is bounded by declared cause structure, not witness count; copies do not add capacity. Under the single covering-cause F5 model, C = log₂n − c·[h(q) + (1−q)·log₂(n−1)]. Keep reliability-is-encounter-rate as a historical alias. |
| Hypotheses | n ≥ 2 equiprobable states; c,q ∈ [0,1] declared; binary entropy h; binary64-log2; Single covering cause only; duplicated/disjoint/triangle governance remains open; L7 conditional-versus-total unanimity meaning remains open; do not use it to infer q |
| Positive test proposal | Single covering cause n=4,c=1/5 with q=0 and q=1/2 reproduces approximately 1.683 and 1.642 bits; copies preserve the bound. |
| Negative test proposal | Same witness/encounter count with different declared causes or q has different C, defeating encounter rate as reliability; missing q refuses; two witnesses requesting c and three binary witnesses remain unmeasured; perfect agreement reports no-dissent. |
| Outgoing premises | law/A1-encounter, law/T10-drift |
| Incoming law premises | none |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9`
- `docs/paper.md:84`
- `docs/reference.md:382`
- `src/laws/laws.bound:56`
- `test/laws.test.ts:389`

## T18 · T18-freedom-is-a-currency

Current kind: `theorem`; historical scope: `law/T18-freedom-is-a-currency`.
Source: `src/laws/laws.bound:59`; line SHA-256: `c8c090e531ba88653592fec02422365b2b78e11ef22821c8e472bba9e4516b0f`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> closed bits with a second origin are scarce, unforgeable, measurable, transferable and third-party verifiable; no issuer exists

| Acta field | Proposal / record |
|---|---|
| Status | defined proposal; implementation pending |
| Basis | L4 |
| Proposed replacement | Under declared and justified failure probabilities p_i, the meet guarantee is at least max(0, 1 − Σp_i). If Σp_i ≥ 1, report the bound as trivial. Agreement and copy count do not estimate p_i. |
| Hypotheses | Each p_i ∈ [0,1] is declared and justified for its entering origin; Union bound does not require independence; confidence is distinct from currency properties |
| Positive test proposal | Declared p=(0.1,0.2) yields guarantee ≥0.7; p=(0.6,0.5) yields trivial zero lower bound. |
| Negative test proposal | Undeclared or unjustified p_i cannot yield a confidence guarantee; copied agreement cannot manufacture probabilities or third-party-verifiable reliability. |
| Outgoing premises | law/A7-freedom-conserved, law/D9-yield, law/A5-origin-is-extension |
| Incoming law premises | law/T40-cost-by-density (line 78), law/T44-an-origin-is-worth-its-reach (line 82) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9`
- `docs/paper.md:90,107,111`
- `docs/reference.md:388,405,409`
- `src/laws/laws.bound:59,78,82`
- `test/laws.test.ts:392`

## T38 · T38-origins-are-a-polygon

Current kind: `theorem`; historical scope: `law/T38-origins-are-a-polygon`.
Source: `src/laws/laws.bound:72`; line SHA-256: `01661aa7bebcec67b5adfe03c4a4bda5a9358349eb9f24d56556da641dc849b9`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> n independent origins on a cell are the vertices of a polygon whose interior is their meet: two an edge, three an area, four a vertex the others do not enclose, five a verdict that holds without any one of them, and beyond that a meet that narrows toward consensus — a meet that never closes at any n is two cells wearing one name

| Acta field | Proposal / record |
|---|---|
| Status | defined proposal; implementation pending |
| Basis | L2/F2/F3 |
| Proposed replacement | Conflict witness size depends on the declared form: intervals of a lattice h=2; convex forms in R^d h≤d+1 (d=2:3); cyclic arcs without a declared cut have no finite general Helly number, while arcs not crossing a declared cut have h=2; Shannon partitions have no finite general Helly number. Polygon imagery is restricted to the interval contract, not arbitrary origins. |
| Hypotheses | Form and lattice/geometry declared; convexity for R^d; finite families where required; Declared cut and noncrossing arcs for cyclic h=2; F2 finite circle is a counterexample to pair sufficiency, not a proof of unbounded h |
| Positive test proposal | Intervals with conflicting meet expose a pair; F3 seller/auditor witness {x+y≤12,x+y≥14}; F3 {x≥0,y≥0,x+y≤−1} requires all three. |
| Negative test proposal | F2 circle 12, arcs of 5 discrete points starting 0,4,8: every pair intersects but triple is empty; refuse applying interval h=2 to this uncut cyclic form. |
| Outgoing premises | law/A1-encounter, law/A2-meet, law/A5-origin-is-extension, law/T2-coordinate-where-disagree |
| Incoming law premises | law/T40-cost-by-density (line 78) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9`
- `docs/paper.md:104,107`
- `docs/reference.md:253,255,259,268,275,284,290,291,402,405`
- `offers.bound:128,129,130,131,132,133,134,135`
- `src/laws/laws.bound:72,78`
- `test/loom.test.ts:74,75`

## T87 · T87-the-quarter-turn

Current kind: `theorem`; historical scope: `law/T87-the-quarter-turn`.
Source: `src/laws/laws.bound:127`; line SHA-256: `b43d9ba5d49e3af5e203fe7e0f4113458217792ff263f6e1cc71b0e18980ba63`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> two claims reinforce within a quarter turn of each other and cancel beyond it, since |e^{ia} + e^{ib}|² < 2 exactly when |a − b| > π/2: a fork is destructive interference, and a field is laminar while fewer than half its pairs lie beyond a quarter turn, forks over closes below one

| Acta field | Proposal / record |
|---|---|
| Status | open; domain and optimization objective unconfirmed |
| Basis | F4 and updated plan |
| Proposed replacement | Provisional formula only: RI = log₂(n/p) − h(s/p), with n states, p dividing n and 0≤s<p. No near-phase worst-case replacement is approved pending domain and objective confirmation. |
| Hypotheses | Provisional integer n=12,p=4,s∈{0,1,2,3}; entropy endpoints use h(0)=h(1)=0; Definition of RI, meaning of near-phase/anti-phase, and optimized quantity remain unconfirmed |
| Positive test proposal | Proposed controls s=0,1,2,3 evaluate log₂3, log₂3−h(1/4), log₂3−1, log₂3−h(3/4); record assumed domain. |
| Negative test proposal | If worst means minimum RI, s=2 yields a smaller value than s=0; reject claiming near-phase closure from this formula alone. Refuse p not dividing n and shifts outside [0,p). |
| Outgoing premises | law/T48-epoch-is-phase, law/T49-amplitude-has-sign-and-phase, law/A8-four-states |
| Incoming law premises | law/T88-turbulence-is-factions (line 128), law/T89-disagreement-is-where-to-look (line 129), law/H10-the-period-is-a-line-of-the-region (line 143) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9,193`
- `docs/paper.md:67,136,137,138`
- `docs/reference.md:115,170,365,434,435,436`
- `offers.bound:216,217`
- `src/laws/laws.bound:124,127,128,129,143`
- `test/object.test.ts:40,41,63`

## A7 · A7-freedom-conserved

Current kind: `axiom`; historical scope: `law/A7-freedom-conserved`.
Source: `src/laws/laws.bound:10`; line SHA-256: `86accf78f1153c53f48c261a557a9d6c3e52dd358893e594b7b887a6d9d55964`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> the freedom of a system is the sum of its cells' debits in bits; an encounter never raises it; only a new coordinate does

| Acta field | Proposal / record |
|---|---|
| Status | open; replacement undefined |
| Basis | §5 obl.open-A7-T90 / obl.open-A9-T99 |
| Proposed replacement | replacement undefined |
| Hypotheses | Author has supplied no replacement statement for this ID; P1 well-foundedness and budget do not by themselves prove totality or conservation |
| Positive test proposal | Proposal only: retain historical fixtures as baseline observations; define a new positive contract only after the author supplies a replacement. |
| Negative test proposal | Proposal only: reject treating missing replacement, instruction-budget exhaustion or a simulation as proof of the historical statement. |
| Outgoing premises | none |
| Incoming law premises | law/T18-freedom-is-a-currency (line 59), law/T24-ignorance-has-coordinates (line 65), law/T27-disagreement-can-be-provoked (line 68), law/T47-a-two-pole-object (line 85), law/D11-the-obligatory (line 89), law/T73-a-cell-that-folds-itself-converges (line 108), law/T90-freedom-is-entropy (line 130), law/T100-an-act-is-paid-with-attention (line 137) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9,193`
- `docs/paper.md:48,57,78,90,97,100,114,133,140`
- `docs/reference.md:141,153,346,355,376,388,395,398,412,431,438`
- `offers.bound:163,172`
- `src/laws/laws.bound:10,59,65,68,85,89,108,121,130,137`
- `test/laws.test.ts:374`

## T90 · T90-freedom-is-entropy

Current kind: `theorem`; historical scope: `law/T90-freedom-is-entropy`.
Source: `src/laws/laws.bound:130`; line SHA-256: `ea5476ce79837b9f22a2a7a77f15ec5c4774bd45e8889ab1d229b032cede763b`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> freedom is log₂ of the states between the poles, which is the cell's entropy: encounters lower it, vacuity raises it, and nothing else moves it; two paths interfere from phase alone, and that is lost once which path was taken is observed

| Acta field | Proposal / record |
|---|---|
| Status | open; replacement undefined |
| Basis | §5 obl.open-A7-T90 / obl.open-A9-T99 |
| Proposed replacement | replacement undefined |
| Hypotheses | Author has supplied no replacement statement for this ID; P1 well-foundedness and budget do not by themselves prove totality or conservation |
| Positive test proposal | Proposal only: retain historical fixtures as baseline observations; define a new positive contract only after the author supplies a replacement. |
| Negative test proposal | Proposal only: reject treating missing replacement, instruction-budget exhaustion or a simulation as proof of the historical statement. |
| Outgoing premises | law/D4-debit-in-bits, law/A7-freedom-conserved, law/T48-epoch-is-phase |
| Incoming law premises | law/T100-an-act-is-paid-with-attention (line 137) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9`
- `docs/paper.md:78,140`
- `docs/reference.md:376,438`
- `src/laws/laws.bound:130,137`
- `test/object.test.ts:105,106,132`

## A9 · A9-everything-is-a-bound

Current kind: `axiom`; historical scope: `law/A9-everything-is-a-bound`.
Source: `src/laws/laws.bound:9`; line SHA-256: `20cfd637aec057225142238777f9df47fa5ca096495d483c2d42231360c1b740`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> one relation: an origin bounds a cell at a resolution and an epoch; cells, origins, locks and laws are cells under it; the relation bounds itself, and there is no level above it

| Acta field | Proposal / record |
|---|---|
| Status | open; replacement undefined |
| Basis | §5 obl.open-A7-T90 / obl.open-A9-T99 |
| Proposed replacement | replacement undefined |
| Hypotheses | Author has supplied no replacement statement for this ID; P1 well-foundedness and budget do not by themselves prove totality or conservation |
| Positive test proposal | Proposal only: retain historical fixtures as baseline observations; define a new positive contract only after the author supplies a replacement. |
| Negative test proposal | Proposal only: reject treating missing replacement, instruction-budget exhaustion or a simulation as proof of the historical statement. |
| Outgoing premises | none |
| Incoming law premises | law/T9-self-application-converges (line 53), law/T26-knowing-has-four-states (line 67), law/T42-no-privileged-observer (line 80), law/T43-each-origin-gives-one-fact-and-one-distance (line 81), law/T45-cells-that-rest-on-one-bound-are-entangled (line 83), law/D11-the-obligatory (line 89), law/T50-signatures-are-meets (line 90), law/T52-directing-where-origins-land-closes-the-horizon (line 92), law/T73-a-cell-that-folds-itself-converges (line 108), law/H9-the-obligatory-is-maximal (line 109), law/T92-a-cell-is-made-of-cells (line 132), law/T99-the-fold-is-total (line 136) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9`
- `docs/paper.md:50,57,75,99,109,110,112,118,120,133,139,142,146`
- `docs/reference.md:348,355,373,397,407,408,410,416,418,431,437,440,444`
- `samples/no/A9-everything-is-a-bound.json:4`
- `samples/yes/A9-everything-is-a-bound.json:73`
- `src/laws/laws.bound:9,53,67,80,81,83,89,90,92,108,109,120,132,136`
- `test/laws.test.ts:352`

## T99 · T99-the-fold-is-total

Current kind: `theorem`; historical scope: `law/T99-the-fold-is-total`.
Source: `src/laws/laws.bound:136`; line SHA-256: `1c6a2e24529d9e6ce44c498469ac063246438b3e2c21a34ba5ce7a88c0458e22`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> the fold is a monotone map on a lattice over a rest order with no cycles: every fold reaches its fixed point in finitely many steps and never fails to answer. The lock is not Turing complete by construction — it cannot loop — so verify can check it, rank can read it before landing, and accept can refuse before running. Arbitrary computation lives only in capsules, outside the fold, admitted by vectors and heard as claims.

| Acta field | Proposal / record |
|---|---|
| Status | open; replacement undefined |
| Basis | §5 obl.open-A7-T90 / obl.open-A9-T99 |
| Proposed replacement | replacement undefined |
| Hypotheses | Author has supplied no replacement statement for this ID; P1 well-foundedness and budget do not by themselves prove totality or conservation |
| Positive test proposal | Proposal only: retain historical fixtures as baseline observations; define a new positive contract only after the author supplies a replacement. |
| Negative test proposal | Proposal only: reject treating missing replacement, instruction-budget exhaustion or a simulation as proof of the historical statement. |
| Outgoing premises | law/A2-meet, law/T9-self-application-converges, law/A9-everything-is-a-bound |
| Incoming law premises | none |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9`
- `docs/paper.md:146`
- `docs/reference.md:196,444`
- `offers.bound:162`
- `src/laws/laws.bound:136`
- `test/object.test.ts:232,233,248`

## H3 · H3-a-distant-signature-moves-a-cell-that-did-not-move

Current kind: `conjecture`; historical scope: `law/H3-a-distant-signature-moves-a-cell-that-did-not-move`.
Source: `src/laws/laws.bound:88`; line SHA-256: `ce898d9714dfadd7a58f1fb16d1df52f0aa93c1bb932074195c81e96263c280e`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> stated as a hint and never as a claim about the world: if what is is a field of floors and ceilings, a distant signature changes a cell whose own record never moved, and in two hundred trials of one cell holding one value the verdict came out both ways, so nothing stored at the cell explains the difference and what explains it is the bound the cell rests on; the resemblance is structural and never arithmetic, with no continuous amplitudes and no inequality violated by number; structural resemblance, one origin, not a claim about the world

| Acta field | Proposal / record |
|---|---|
| Status | open; relabel decision and dependent-reference review pending |
| Basis | §5 obl.relabel-H3-H5 / R15 |
| Proposed replacement | Relabel the current modeled observations as experiments, with inputs and falsifier retained; alternatively restate under a declared order-3 form. Exact alternative statement is replacement undefined; do not assert a law of the world. |
| Hypotheses | One-origin structural reading and finite simulation observations only; Order-3 alternative lacks declared form and proof; no law may cite these as law premises after relabel |
| Positive test proposal | Proposal only: retained yes sample is labeled experiment and declares model, conditions and falsifier; inventory every dependent reference. |
| Negative test proposal | Proposal only: audit rejects any law resting on H3/H5 after experiment relabel, or any physical/general-law conclusion from finite model output. |
| Outgoing premises | law/T46-a-bound-moves-cells-no-walk-reaches, law/T47-a-two-pole-object |
| Incoming law premises | law/H5-hilbert-is-the-obligatory-without-four-fields (line 94) |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9,317`
- `docs/paper.md:69,71`
- `docs/reference.md:367,369`
- `src/laws/laws.bound:88,94`
- `test/wave.test.ts:297,298,312`

## H5 · H5-hilbert-is-the-obligatory-without-four-fields

Current kind: `conjecture`; historical scope: `law/H5-hilbert-is-the-obligatory-without-four-fields`.
Source: `src/laws/laws.bound:94`; line SHA-256: `6bfc4138eda618b9a79cb608479a8284c561dd0e2f159d82bfed311cc7147316`; full-file SHA-256: `96d716899e2e545a662df1dd48a6ae09358c39b177e507507ce782b2d6fc150b`. Hash excludes line terminator.

**Exact current statement:**

> amplitudes with a phase and no origin, no signed ceiling, no resolution and no epoch band are what is left of a cell when those four fields are dropped, so the measurement problem is the absence of who, imposed symmetries the absence of a signed ceiling, the classical limit the absence of resolution and universal interference the absence of bands; restored, four claims in phase keep exactly the share of the whole their number leaves them against an environment spread over the period, and six origins around one value are six objects read finely and one read coarsely, so how many things there are is a reading; structural resemblance, one origin, not a claim about the world

| Acta field | Proposal / record |
|---|---|
| Status | open; relabel decision and dependent-reference review pending |
| Basis | §5 obl.relabel-H3-H5 / R15 |
| Proposed replacement | Relabel the current modeled observations as experiments, with inputs and falsifier retained; alternatively restate under a declared order-3 form. Exact alternative statement is replacement undefined; do not assert a law of the world. |
| Hypotheses | One-origin structural reading and finite simulation observations only; Order-3 alternative lacks declared form and proof; no law may cite these as law premises after relabel |
| Positive test proposal | Proposal only: retained yes sample is labeled experiment and declares model, conditions and falsifier; inventory every dependent reference. |
| Negative test proposal | Proposal only: audit rejects any law resting on H3/H5 after experiment relabel, or any physical/general-law conclusion from finite model output. |
| Outgoing premises | law/H3-a-distant-signature-moves-a-cell-that-did-not-move, law/T49-amplitude-has-sign-and-phase, law/T36-agreement-has-a-resolution, law/T45-cells-that-rest-on-one-bound-are-entangled |
| Incoming law premises | none |
| Reference impact | Review transitive semantic dependence, aliases, samples, formulas, offers and rendered/admitted documentation. Inventory is textual, not proof of semantic completeness; no edit in this wave. |

Text references (path:lines; hashes in JSON):
- `TARGET.bound:5,9,317`
- `docs/paper.md:71`
- `docs/reference.md:114,123,125,198,369`
- `offers.bound:229,230,231,232`
- `src/laws/laws.bound:94`
- `test/obligatory.test.ts:159,160,177`

## H3/H5 relabel boundary

H3 currently rests on T46 and T47; H5 currently rests on H3, T49, T36 and T45. Thus H5 is an incoming law-table reference to H3 even though both are currently classified conjectures. H5 also grounds the decohere, distinct, sameObject and budget offers. A blanket claim that nothing cites these would be false at this base. The relabel lane must review those offers, test labels, samples and retained/rendered TARGET/document references, remove law-premise use where required, and preserve experiment evidence through the prescribed instrument. An order-3 restatement needs its form, witness contract and new proof; this map does not choose or implement it.

## Open contracts carried forward

A7/T90 and A9/T99: replacement undefined. T87: domain/objective and near-phase conclusion unconfirmed. F5 duplicated/disjoint/triangle factor governance: open. L7: whether c/n means conditional, cause contribution or total unanimity, including the private channel, remains open. These open contracts do not prevent a complete source map; they prevent unsupported downstream law closure.
