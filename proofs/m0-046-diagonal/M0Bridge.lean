import Obligations045.M0Offdiag
import Mathlib.Data.Nat.Choose.Sum
import Mathlib.Probability.ProbabilityMassFunction.Integrals
import Mathlib.Algebra.BigOperators.Group.Finset.Pi

open scoped BigOperators
open MeasureTheory ProbabilityTheory Filter Topology
noncomputable section
open Classical
namespace Obligations046.Bridge

def count {n : ℕ} (s : Finset (Fin n)) : Fin (n+1) :=
  ⟨s.card, Nat.lt_succ_of_le (by simpa using s.card_le_univ)⟩
def mass (p : ℝ) {n : ℕ} (s : Finset (Fin n)) : ℝ :=
  p^s.card*(1-p)^(n-s.card)
def binMass (p : ℝ) (n : ℕ) (k : Fin (n+1)) : ℝ :=
  (n.choose k : ℝ)*p^(k:ℕ)*(1-p)^(n-(k:ℕ))

theorem count_fiber_mass (p : ℝ) (n : ℕ) (k : Fin (n+1)) :
    (∑ s : Finset (Fin n), if count s = k then mass p s else 0) = binMass p n k := by
  have hfilter : Finset.univ.filter (fun s : Finset (Fin n) => count s = k) =
      Finset.powersetCard (k:ℕ) (Finset.univ : Finset (Fin n)) := by
    ext s
    simp [count, Fin.ext_iff, Finset.mem_powersetCard]
  rw [← Finset.sum_filter, hfilter]
  calc
    _ = ∑ _s ∈ Finset.powersetCard (k:ℕ) (Finset.univ : Finset (Fin n)),
        p^(k:ℕ)*(1-p)^(n-(k:ℕ)) := by
      apply Finset.sum_congr rfl
      intro s hs
      simp only [Finset.mem_powersetCard] at hs
      simp [mass, hs.2]
    _ = binMass p n k := by
      simp [binMass, Finset.card_powersetCard, nsmul_eq_mul, mul_assoc]

/-- Finite product-law pushforward, before any choice of Bernoulli parameters. -/
theorem product_pushforward {ι : Type*} [Fintype ι] [DecidableEq ι]
    {S T : ι → Type*} [∀ i, Fintype (S i)] [∀ i, Fintype (T i)]
    [∀ i, DecidableEq (T i)] (m : ∀ i, S i → ℝ) (c : ∀ i, S i → T i)
    (f : (∀ i, T i) → ℝ) :
    (∑ x : ∀ i, S i, (∏ i, m i (x i))*f (fun i => c i (x i))) =
      ∑ k : ∀ i, T i, (∏ i, ∑ s : S i, if c i s = k i then m i s else 0)*f k := by
  have gate (x : ∀ i, S i) (k : ∀ i, T i) :
      (∏ i, if c i (x i) = k i then m i (x i) else 0) =
        if (fun i => c i (x i)) = k then ∏ i, m i (x i) else 0 := by
    by_cases h : (fun i => c i (x i)) = k
    · subst k
      simp
    · rw [if_neg h]
      have h' : ∃ i, c i (x i) ≠ k i := by
        by_contra hn
        push_neg at hn
        exact h (funext hn)
      obtain ⟨i, hi⟩ := h'
      exact Finset.prod_eq_zero (Finset.mem_univ i) (by simp [hi])
  symm
  simp_rw [Fintype.prod_sum, Finset.sum_mul]
  rw [Finset.sum_comm]
  apply Finset.sum_congr rfl
  intro x _
  simp_rw [gate, ite_mul, zero_mul]
  simp

/-- Raw individual Bernoulli outcomes are subsets of named member indices. -/
abbrev World {ι : Type*} (n : ι → ℕ) := ∀ i, Finset (Fin (n i))
instance worldMeasurableSpace {ι : Type*} (n : ι → ℕ) : MeasurableSpace (World n) := ⊤
instance worldDiscreteMeasurable {ι : Type*} (n : ι → ℕ) : DiscreteMeasurableSpace (World n) := ⟨fun _ => trivial⟩

def jointMass {ι : Type*} [Fintype ι] (n : ι → ℕ) (p : ι → ℝ)
    (x : World n) : ℝ := ∏ i, mass (p i) (x i)

theorem joint_count_pushforward {ι : Type*} [Fintype ι] [DecidableEq ι]
    (n : ι → ℕ) (p : ι → ℝ) (f : (∀ i, Fin (n i+1)) → ℝ) :
    (∑ x : World n, jointMass n p x*f (fun i => count (x i))) =
      ∑ k : ∀ i, Fin (n i+1), (∏ i, binMass (p i) (n i) (k i))*f k := by
  simpa [jointMass, count_fiber_mass] using
    product_pushforward (fun i => mass (p i)) (fun _ => count) f

theorem mass_sum (p : ℝ) (n : ℕ) :
    ∑ s : Finset (Fin n), mass p s = 1 := by
  have h := Finset.sum_powerset_apply_card (fun k => p^k*(1-p)^(n-k))
    (x := (Finset.univ : Finset (Fin n)))
  simp only [Finset.powerset_univ, Finset.card_univ, Fintype.card_fin, nsmul_eq_mul] at h
  change (∑ s : Finset (Fin n), p^s.card*(1-p)^(n-s.card)) = 1
  rw [h]
  calc
    _ = (p+(1-p))^n := by
      rw [add_pow]
      apply Finset.sum_congr rfl
      intro k _
      ring
    _ = 1 := by simp

theorem mass_nonneg (p : ℝ) (hp : 0 ≤ p) (hp1 : p ≤ 1)
    {n : ℕ} (s : Finset (Fin n)) : 0 ≤ mass p s :=
  mul_nonneg (pow_nonneg hp _) (pow_nonneg (sub_nonneg.mpr hp1) _)

theorem jointMass_sum {ι : Type*} [Fintype ι] [DecidableEq ι]
    (n : ι → ℕ) (p : ι → ℝ) : ∑ x : World n, jointMass n p x = 1 := by
  simp only [jointMass, ← Fintype.prod_sum, mass_sum, Finset.prod_const_one]

def memberLaw {ι : Type*} [Fintype ι] [DecidableEq ι]
    (n : ι → ℕ) (p : ι → ℝ) (hp : ∀ i, 0 ≤ p i) (hp1 : ∀ i, p i ≤ 1) :
    PMF (World n) :=
  PMF.ofFintype (fun x => ENNReal.ofReal (jointMass n p x)) (by
    rw [← ENNReal.ofReal_sum_of_nonneg]
    · simp [jointMass_sum]
    · intro x _
      exact Finset.prod_nonneg (fun i _ => mass_nonneg (p i) (hp i) (hp1 i) (x i)))

theorem memberLaw_expectation {ι : Type*} [Fintype ι] [DecidableEq ι]
    (n : ι → ℕ) (p : ι → ℝ) (hp : ∀ i, 0 ≤ p i) (hp1 : ∀ i, p i ≤ 1)
    (f : World n → ℝ) :
    (∫ x, f x ∂(memberLaw n p hp hp1).toMeasure) =
      ∑ x : World n, jointMass n p x*f x := by
  rw [PMF.integral_eq_sum]
  apply Finset.sum_congr rfl
  intro x _
  simp only [memberLaw, PMF.ofFintype_apply, smul_eq_mul]
  have hm : 0 ≤ jointMass n p x := Finset.prod_nonneg
    (fun i _ => mass_nonneg (p i) (hp i) (hp1 i) (x i))
  rw [ENNReal.toReal_ofReal hm]

open Obligations045.M0
abbrev sizes (M : Domain) (N : ℕ) (i : Fin M.K) := allocation M.w N i
def modelLaw (M : Domain) (N : ℕ) (a : Fin M.K → Bool) : PMF (World (sizes M N)) :=
  memberLaw (sizes M N) (fun i => q M (a i))
    (fun i => (q_pos M (a i)).le) (fun i => (q_lt_one M (a i)).le)
def correctCount {ι : Type*} [Fintype ι] {n : ι → ℕ} (x : World n) : ℕ :=
  ∑ i, (x i).card

/-- Exact finite expectation of individual Bernoulli member outcomes, not an assumed count law. -/
theorem conditional_error_representation (M : Domain) (N : ℕ) (a : Fin M.K → Bool) :
    (∫ x, fairLoss (correctCount x) N ∂(modelLaw M N a).toMeasure) =
      conditionalError M N a := by
  rw [modelLaw, memberLaw_expectation]
  have h := joint_count_pushforward (sizes M N) (fun i => q M (a i))
    (fun k => fairLoss (∑ i, (k i : ℕ)) N)
  simpa [conditionalError, binMass, count, correctCount, sizes] using h

/-- N=0 has fairLoss=1/2; it is not the average bridge. -/
theorem conditional_error_zero (M : Domain) (a : Fin M.K → Bool) :
    conditionalError M 0 a = 1/2 := by
  rw [← conditional_error_representation]
  have hz : ∀ x : World (sizes M 0), correctCount x = 0 := by
    intro x
    have h : ∀ i, x i = ∅ := by
      intro i
      apply Finset.eq_empty_iff_forall_not_mem.mpr
      intro j _
      have hj := j.isLt
      simp [sizes, allocation] at hj
    simp [correctCount, h]
  simp [hz, fairLoss]

theorem fair_loss_average_bridge (total N : ℕ) (hN : 0 < N) :
    fairLoss total N = limitingLoss ((total:ℝ)/(N:ℝ)) := by
  have hn : (0:ℝ) < N := by exact_mod_cast hN
  have hlt : (total:ℝ)/(N:ℝ) < (1:ℝ)/2 ↔ 2*total < N := by
    rw [div_lt_iff₀ hn]
    constructor
    · intro h
      exact_mod_cast (show (2:ℝ)*total < N by linarith)
    · intro h
      have h' : (2:ℝ)*total < N := by exact_mod_cast h
      linarith
  have heq : (total:ℝ)/(N:ℝ) = (1:ℝ)/2 ↔ 2*total = N := by
    rw [div_eq_iff hn.ne']
    constructor
    · intro h
      exact_mod_cast (show (2:ℝ)*total = N by linarith)
    · intro h
      have h' : (2:ℝ)*total = N := by exact_mod_cast h
      linarith
  unfold fairLoss limitingLoss
  simp only [hlt, heq]

/-- Probability of every joint count event, derived from raw member product probabilities. -/
theorem lineage_count_binomial_law {ι : Type*} [Fintype ι] [DecidableEq ι]
    (n : ι → ℕ) (p : ι → ℝ) (hp : ∀ i, 0 ≤ p i) (hp1 : ∀ i, p i ≤ 1)
    (k : ∀ i, Fin (n i+1)) :
    (∫ x, if (fun i => count (x i)) = k then (1:ℝ) else 0
      ∂(memberLaw n p hp hp1).toMeasure) = ∏ i, binMass (p i) (n i) (k i) := by
  rw [memberLaw_expectation]
  simpa using joint_count_pushforward n p (fun z => if z = k then (1:ℝ) else 0)

/-- The snapshot retains individual named Bernoulli outcomes; it is not a count-law certificate. -/
def snapshot {Ω : Type*} (M : Domain) (N : ℕ)
    (X : Fin M.K → ℕ → Ω → Bool) (ω : Ω) : World (sizes M N) :=
  fun i => Finset.univ.filter (fun j : Fin (sizes M N i) => X i j ω)
def indicator {Ω : Type*} {K : ℕ} (X : Fin K → ℕ → Ω → Bool) : Fin K → ℕ → Ω → ℝ :=
  fun i j ω => if X i j ω then 1 else 0

theorem snapshot_card {Ω : Type*} (M : Domain) (N : ℕ)
    (X : Fin M.K → ℕ → Ω → Bool) (ω : Ω) (i : Fin M.K) :
    (((snapshot M N X ω) i).card : ℝ) =
      ∑ j ∈ Finset.range (allocation M.w N i), indicator X i j ω := by
  simp only [snapshot, Finset.card_filter, Nat.cast_sum, Nat.cast_ite,
    Nat.cast_one, Nat.cast_zero, indicator]
  exact Fin.sum_univ_eq_sum_range (fun j => if X i j ω then (1:ℝ) else 0) _

theorem snapshot_average {Ω : Type*} (M : Domain) (N : ℕ)
    (X : Fin M.K → ℕ → Ω → Bool) (ω : Ω) :
    memberAverage M (indicator X) N ω = (correctCount (snapshot M N X ω):ℝ)/(N:ℝ) := by
  simp only [memberAverage, correctCount, Nat.cast_sum, snapshot_card, Finset.sum_div]

/-- Transfer from a declared joint Bernoulli MEMBER law on an ambient probability space.
    hproduct names all raw bits, not counts, their expectation, or a tail/convergence law. -/
theorem ambient_conditional_error_representation {Ω : Type*} [MeasurableSpace Ω]
    (M : Domain) (N : ℕ) (a : Fin M.K → Bool) (μ : Measure Ω)
    (X : Fin M.K → ℕ → Ω → Bool) (hN : 0 < N)
    (hmeas : AEMeasurable (snapshot M N X) μ)
    (hproduct : Measure.map (snapshot M N X) μ = (modelLaw M N a).toMeasure) :
    (∫ ω, limitingLoss (memberAverage M (indicator X) N ω) ∂μ) =
      conditionalError M N a := by
  have hpoint : (fun ω => limitingLoss (memberAverage M (indicator X) N ω)) =
      (fun ω => fairLoss (correctCount (snapshot M N X ω)) N) := by
    funext ω
    rw [snapshot_average, fair_loss_average_bridge _ _ hN]
  rw [hpoint]
  have hf : AEStronglyMeasurable (fun x : World (sizes M N) => fairLoss (correctCount x) N)
      (Measure.map (snapshot M N X) μ) := Measurable.of_discrete.stronglyMeasurable.aestronglyMeasurable
  rw [← integral_map hmeas hf, hproduct, conditional_error_representation]

theorem mixture_error_representation {Ω : Type*} [MeasurableSpace Ω]
    (M : Domain) (N : ℕ) (μ : Measure Ω)
    (X : (Fin M.K → Bool) → Fin M.K → ℕ → Ω → Bool) (hN : 0 < N)
    (hmeas : ∀ a, AEMeasurable (snapshot M N (X a)) μ)
    (hproduct : ∀ a, Measure.map (snapshot M N (X a)) μ = (modelLaw M N a).toMeasure) :
    error M N = ∑ a : Fin M.K → Bool, latentMass M a *
      ∫ ω, limitingLoss (memberAverage M (indicator (X a)) N ω) ∂μ := by
  unfold error
  apply Finset.sum_congr rfl
  intro a _
  rw [ambient_conditional_error_representation M N a μ (X a) hN (hmeas a) (hproduct a)]

/-- The implementation limit follows from the old model theorem and the new representation bridge.
    No CLT, diagonal theorem, count-law certificate, or convergence premise is assumed. -/
theorem computational_offdiag_limit {Ω : Type*} [MeasurableSpace Ω]
    (M : Domain) (μ : Measure Ω) [IsProbabilityMeasure μ]
    (X : (Fin M.K → Bool) → Fin M.K → ℕ → Ω → Bool)
    (hsnapshot : ∀ a N, AEMeasurable (snapshot M N (X a)) μ)
    (hproduct : ∀ a N, Measure.map (snapshot M N (X a)) μ = (modelLaw M N a).toMeasure)
    (hint : ∀ a i, Integrable (indicator (X a) i 0) μ)
    (hindep : ∀ a i, Pairwise (fun j k : ℕ => IndepFun (indicator (X a) i j) (indicator (X a) i k) μ))
    (hident : ∀ a i j, IdentDistrib (indicator (X a) i j) (indicator (X a) i 0) μ μ)
    (hmean : ∀ a i, ∫ ω, indicator (X a) i 0 ω ∂μ = q M (a i))
    (hmeas : ∀ a N, AEStronglyMeasurable
      (fun ω => limitingLoss (memberAverage M (indicator (X a)) N ω)) μ)
    (hoff : ∀ a, score M a ≠ (1:ℝ)/2) :
    Tendsto (error M) atTop (𝓝 (floor M)) := by
  have h := floor_limit_offdiag_mixture M μ (fun a => indicator (X a))
    hint hindep hident hmean hmeas hoff
  have heq : (fun N => error M N) =ᶠ[atTop]
      (fun N => ∑ a : Fin M.K → Bool, latentMass M a *
        ∫ ω, limitingLoss (memberAverage M (indicator (X a)) N ω) ∂μ) := by
    filter_upwards [eventually_ge_atTop 1] with N hN
    exact mixture_error_representation M N μ X (lt_of_lt_of_le Nat.zero_lt_one hN)
      (fun a => hsnapshot a N) (fun a => hproduct a N)
  exact h.congr' heq.symm

/-- The starting probability is the product over NAMED INDIVIDUAL bits, with no binomial factor. -/
theorem mass_eq_individual_product (p : ℝ) {n : ℕ} (s : Finset (Fin n)) :
    mass p s = ∏ j : Fin n, if j ∈ s then p else 1-p := by
  have hc : (Finset.univ.filter (fun j : Fin n => j ∉ s)) = sᶜ := by
    ext j
    simp
  rw [Finset.prod_ite]
  simp [mass, Finset.filter_mem_eq_inter, hc, Finset.card_compl]

theorem memberLaw_individual_probability {ι : Type*} [Fintype ι] [DecidableEq ι]
    (n : ι → ℕ) (p : ι → ℝ) (hp : ∀ i, 0 ≤ p i) (hp1 : ∀ i, p i ≤ 1)
    (x : World n) :
    ((memberLaw n p hp hp1) x).toReal =
      ∏ i, ∏ j : Fin (n i), if j ∈ x i then p i else 1-p i := by
  simp only [memberLaw, PMF.ofFintype_apply]
  have hm : 0 ≤ jointMass n p x := Finset.prod_nonneg
    (fun i _ => mass_nonneg (p i) (hp i) (hp1 i) (x i))
  rw [ENNReal.toReal_ofReal hm]
  simp only [jointMass, mass_eq_individual_product]

theorem zero_average_counterexample : fairLoss 0 0 ≠ limitingLoss ((0:ℝ)/0) := by
  norm_num [fairLoss, limitingLoss]

theorem latentMass_sum (M : Domain) : ∑ a : Fin M.K → Bool, latentMass M a = 1 := by
  have h := (Fintype.prod_sum (fun (_i : Fin M.K) (b : Bool) =>
    if b then M.p else 1-M.p)).symm
  simpa [latentMass] using h

/-- The finite mixture itself equals the existing implementation for EVERY N,
    including zero. Its product-Bernoulli latent weights sum to one. -/
theorem model_mixture_error_representation (M : Domain) (N : ℕ) :
    (∑ a : Fin M.K → Bool, latentMass M a *
      ∫ x, fairLoss (correctCount x) N ∂(modelLaw M N a).toMeasure) = error M N := by
  unfold error
  apply Finset.sum_congr rfl
  intro a _
  rw [conditional_error_representation]

end Obligations046.Bridge
