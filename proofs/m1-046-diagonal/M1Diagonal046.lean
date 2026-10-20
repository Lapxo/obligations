import M1Offdiag046
import M0Lindeberg046
import M0Threshold046

open scoped BigOperators
open Filter Topology MeasureTheory ProbabilityTheory
noncomputable section
open Classical Obligations046.M1Bridge Obligations046.M1Offdiag Obligations046.Bridge
namespace Obligations046.M1Diagonal

def fresh (M : Model) : ℝ := (1-M.base.c)*(1-M.c2)
def varianceLower (M : Model) : ℝ := (fresh M)^2*M.base.p*(1-M.base.p)

theorem fresh_pos (M : Model) : 0 < fresh M :=
  mul_pos (by linarith [M.base.c_lt_one]) (by linarith [M.c2_lt_one])

theorem variance_lower_pos (M : Model) : 0 < varianceLower M := by
  unfold varianceLower
  exact mul_pos (mul_pos (sq_pos_of_pos (fresh_pos M)) (by linarith [M.base.p_half]))
    (by linarith [M.base.p_lt_one])

theorem fresh_probability_bounds (M : Model) (A : Ancestors M) (B : Leaves M)
    (i : Fin M.base.K) :
    fresh M*M.base.p ≤ q M A B i ∧ fresh M*(1-M.base.p) ≤ 1-q M A B i := by
  let a := M.base.c
  let b := (1-M.base.c)*M.c2
  let d := fresh M
  have ha : 0 ≤ a := M.base.c_nonneg
  have hb : 0 ≤ b := mul_nonneg (by linarith [M.base.c_lt_one]) M.c2_nonneg
  have hd : 0 ≤ d := (fresh_pos M).le
  have hs : a+b+d=1 := by dsimp [a,b,d,fresh]; ring
  change d*M.base.p ≤ a*(if A (M.parent i) then 1 else 0)+
      b*(if B i then 1 else 0)+d*M.base.p ∧
    d*(1-M.base.p) ≤ 1-(a*(if A (M.parent i) then 1 else 0)+
      b*(if B i then 1 else 0)+d*M.base.p)
  cases A (M.parent i) <;> cases B i <;> simp only [Bool.false_eq_true, ite_false, ite_true,
    mul_zero, mul_one, zero_add, add_zero] <;> constructor <;> nlinarith

theorem bernoulli_variance_lower (M : Model) (A : Ancestors M) (B : Leaves M)
    (i : Fin M.base.K) : varianceLower M ≤ q M A B i*(1-q M A B i) := by
  have h := fresh_probability_bounds M A B i
  have hp : 0 ≤ fresh M*M.base.p := mul_nonneg (fresh_pos M).le (by linarith [M.base.p_half])
  have hmul := mul_le_mul h.1 h.2
    (mul_nonneg (fresh_pos M).le (by linarith [M.base.p_lt_one])) (q_bounds M A B i).1
  unfold varianceLower
  nlinarith only [hmul]

theorem finite_variance_lower (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) :
    (N:ℝ)*varianceLower M ≤ variance M A B N := by
  have hsum : ∑ i : Fin M.base.K, (sizes M N i:ℝ) = (N:ℝ) := by
    exact_mod_cast (by simpa only [Fin.sum_univ_eq_sum_range] using
      Obligations045.M0.allocation_sum M.base N)
  calc
    _ = ∑ i : Fin M.base.K, (sizes M N i:ℝ)*varianceLower M := by
      rw [← Finset.sum_mul, hsum]
    _ ≤ _ := by
      apply Finset.sum_le_sum
      intro i _
      simpa only [mul_assoc] using mul_le_mul_of_nonneg_left
        (bernoulli_variance_lower M A B i) (Nat.cast_nonneg (sizes M N i))

theorem variance_atTop (M : Model) (A : Ancestors M) (B : Leaves M) :
    Tendsto (variance M A B) atTop atTop := by
  apply tendsto_atTop_mono (fun N => finite_variance_lower M A B N)
  exact tendsto_natCast_atTop_atTop.atTop_mul_const (variance_lower_pos M)

theorem mean_rounding_bound (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) :
    |mean M A B N-(N:ℝ)*score M A B| ≤ (M.base.K:ℝ) := by
  have heq : mean M A B N-(N:ℝ)*score M A B =
      ∑ i : Fin M.base.K, ((sizes M N i:ℝ)-(N:ℝ)*M.base.w i)*q M A B i := by
    simp only [mean, score, Finset.mul_sum, ← Finset.sum_sub_distrib]
    apply Finset.sum_congr rfl
    intro i _
    ring
  rw [heq]
  calc
    _ ≤ ∑ i : Fin M.base.K, |((sizes M N i:ℝ)-(N:ℝ)*M.base.w i)*q M A B i| :=
      Finset.abs_sum_le_sum_abs _ _
    _ ≤ ∑ _i : Fin M.base.K, (1:ℝ) := by
      apply Finset.sum_le_sum
      intro i _
      rw [abs_mul, abs_of_nonneg (q_bounds M A B i).1]
      have hdis : |(sizes M N i:ℝ)-(N:ℝ)*M.base.w i| ≤ 1 :=
        abs_le.mpr ⟨(Obligations045.M0.allocation_discrepancy M.base N i).1.le,
          (Obligations045.M0.allocation_discrepancy M.base N i).2.le⟩
      exact (mul_le_mul_of_nonneg_right hdis (q_bounds M A B i).1).trans
        (by simpa using (q_bounds M A B i).2)
    _ = _ := by simp

theorem diagonal_drift_squared_limit (M : Model) (A : Ancestors M) (B : Leaves M)
    (hdiag : score M A B=(1:ℝ)/2) :
    Tendsto (fun N : ℕ => (mean M A B N-(N:ℝ)/2)^2/variance M A B N)
      atTop (𝓝 0) := by
  have hupper : Tendsto (fun N : ℕ => (M.base.K:ℝ)^2/variance M A B N) atTop (𝓝 0) :=
    tendsto_const_nhds.div_atTop (variance_atTop M A B)
  apply tendsto_of_tendsto_of_tendsto_of_le_of_le' tendsto_const_nhds hupper
  · filter_upwards [(variance_atTop M A B).eventually (eventually_ge_atTop 1)] with N hN
    exact div_nonneg (sq_nonneg _) (by linarith)
  · filter_upwards [(variance_atTop M A B).eventually (eventually_ge_atTop 1)] with N hN
    apply div_le_div_of_nonneg_right _ (by linarith)
    have habs := mean_rounding_bound M A B N
    rw [hdiag, mul_one_div] at habs
    nlinarith [sq_abs (mean M A B N-(N:ℝ)/2), abs_nonneg (mean M A B N-(N:ℝ)/2)]

def sigma (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) : ℝ :=
  Real.sqrt (variance M A B N)
def threshold (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) : ℝ :=
  ((N:ℝ)/2-mean M A B N)/sigma M A B N

theorem sigma_pos (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (hN : 0<N) :
    0 < sigma M A B N := by
  apply Real.sqrt_pos.2
  exact lt_of_lt_of_le (mul_pos (by exact_mod_cast hN) (variance_lower_pos M))
    (finite_variance_lower M A B N)

theorem threshold_limit (M : Model) (A : Ancestors M) (B : Leaves M)
    (hdiag : score M A B=(1:ℝ)/2) : Tendsto (threshold M A B) atTop (𝓝 0) := by
  have h := (diagonal_drift_squared_limit M A B hdiag).sqrt
  apply (tendsto_zero_iff_norm_tendsto_zero).mpr
  simpa only [threshold, sigma, Real.norm_eq_abs, abs_div,
    abs_of_nonneg (Real.sqrt_nonneg _), abs_sub_comm,
    Real.sqrt_div (sq_nonneg _), Real.sqrt_sq_eq_abs, Real.sqrt_zero] using h

def lindebergRatio (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (eps : ℝ) : ℝ :=
  (∑ i : Fin M.base.K, (sizes M N i:ℝ)*Obligations046.Lindeberg.bernoulliTail
    (q M A B i) (eps^2*variance M A B N))/variance M A B N

theorem lindeberg_eventually_zero (M : Model) (A : Ancestors M) (B : Leaves M)
    (eps : ℝ) (he : 0<eps) : ∀ᶠ N in atTop, lindebergRatio M A B N eps=0 := by
  have hv := (variance_atTop M A B).eventually (eventually_ge_atTop (1/eps^2))
  filter_upwards [hv] with N hN
  have hc : 1 ≤ eps^2*variance M A B N := by
    simpa only [mul_comm] using (div_le_iff₀ (sq_pos_of_pos he)).mp hN
  have hz (i : Fin M.base.K) := Obligations046.Lindeberg.bernoulli_tail_zero
    (q M A B i) _ (q_bounds M A B i).1 (q_bounds M A B i).2 hc
  simp only [lindebergRatio, hz, mul_zero, Finset.sum_const_zero, zero_div]

theorem lindeberg_limit (M : Model) (A : Ancestors M) (B : Leaves M)
    (eps : ℝ) (he : 0<eps) :
    Tendsto (fun N => lindebergRatio M A B N eps) atTop (𝓝 0) := by
  have hEq : (fun N => lindebergRatio M A B N eps) =ᶠ[atTop] (fun _ => 0) :=
    lindeberg_eventually_zero M A B eps he
  exact tendsto_const_nhds.congr' hEq.symm

/-- Genuine diagonal region: exact at everyN, without any CLT assumption. -/
theorem unbiased_conditional_exact (M : Model) (A : Ancestors M) (B : Leaves M)
    (hunbiased : ∀ i, q M A B i=(1:ℝ)/2) (N : ℕ) :
    binomialError M N A B=(1:ℝ)/2 := by
  let f : World (sizes M N) → ℝ := fun x =>
    jointMass (sizes M N) (fun _ => (1/2:ℝ)) x * Obligations045.M0.fairLoss (correctCount x) N
  have hq : q M A B=(fun _ => (1:ℝ)/2) := funext hunbiased
  have hrep : binomialError M N A B=∑ x, f x := by
    rw [conditional_member_error]
    simp only [f, weights, hq]
  have hsym : ∑ x, f (Obligations046.Diagonal.complement x)=∑ x, f x :=
    Fintype.sum_bijective Obligations046.Diagonal.complement
      ⟨fun x y h => by simpa only [Obligations046.Diagonal.complement_involutive]
          using congrArg Obligations046.Diagonal.complement h,
       fun x => ⟨Obligations046.Diagonal.complement x,
         Obligations046.Diagonal.complement_involutive x⟩⟩ _ _ (fun _ => rfl)
  have hpair : ∀ x, f (Obligations046.Diagonal.complement x)+f x=
      jointMass (sizes M N) (fun _ => (1/2:ℝ)) x := by
    intro x
    simp only [f, Obligations046.Diagonal.unbiased_joint_complement, ← mul_add]
    rw [Obligations046.Diagonal.fair_loss_reflection _ _ _
      (Obligations046.Diagonal.count_complement M.base N x), mul_one]
  have htotal : (∑ x, f (Obligations046.Diagonal.complement x))+(∑ x, f x)=1 := by
    rw [← Finset.sum_add_distrib]
    simp only [hpair]
    exact jointMass_sum _ _
  rw [hrep]
  linarith

theorem unbiased_score (M : Model) (A : Ancestors M) (B : Leaves M)
    (hunbiased : ∀ i, q M A B i=(1:ℝ)/2) : score M A B=(1:ℝ)/2 := by
  have hs : ∑ i : Fin M.base.K, M.base.w i=1 := by
    simpa only [Fin.sum_univ_eq_sum_range] using M.base.weights_sum
  simp only [score, hunbiased, ← Finset.sum_mul, hs, one_mul]

theorem conditional_limit_offdiag_or_unbiased (M : Model) (A : Ancestors M) (B : Leaves M)
    (hregion : score M A B ≠ (1:ℝ)/2 ∨ ∀ i, q M A B i=(1:ℝ)/2) :
    Tendsto (fun N => binomialError M N A B) atTop
      (𝓝 (Obligations045.M0.limitingLoss (score M A B))) := by
  rcases hregion with h | h
  · exact conditional_offdiag_limit M A B h
  · rw [unbiased_score M A B h]
    norm_num [Obligations045.M0.limitingLoss]
    simpa only [unbiased_conditional_exact M A B h] using
      (tendsto_const_nhds : Tendsto (fun _ : ℕ => (1:ℝ)/2) atTop (𝓝 ((1:ℝ)/2)))

/-- Full mixture may contain genuinely diagonal states, provided every such state
is in the proved unbiased subdomain. Heterogeneous diagonal is NOT assumed solved. -/
theorem implementation_limit_offdiag_or_unbiased (M : Model)
    (hregions : ∀ (A : Ancestors M) (B : Leaves M),
      score M A B ≠ (1:ℝ)/2 ∨ ∀ i, q M A B i=(1:ℝ)/2) :
    Tendsto (implementationError M) atTop (𝓝 (thresholdFunctional M)) := by
  unfold implementationError thresholdFunctional
  apply tendsto_finset_sum
  intro A _
  apply tendsto_finset_sum
  intro B _
  exact tendsto_const_nhds.mul (conditional_limit_offdiag_or_unbiased M A B (hregions A B))

theorem generator_limit_offdiag_or_unbiased (M : Model)
    (hregions : ∀ (A : Ancestors M) (B : Leaves M),
      score M A B ≠ (1:ℝ)/2 ∨ ∀ i, q M A B i=(1:ℝ)/2) :
    Tendsto (fun N : ℕ => ∫ x, Obligations045.M0.fairLoss
      (∑ i, (primitiveCounts M N x.1.1 x.1.2 x.2 i:ℕ)) N ∂(fullLaw M N).toMeasure)
      atTop (𝓝 (thresholdFunctional M)) := by
  simpa only [full_generator_error_bridge] using implementation_limit_offdiag_or_unbiased M hregions

/-- Finite CDF under the declared conditional product-member law. -/
def cdf (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (z : ℝ) : ℝ :=
  ∑ x : members M N, weights M A B N x*
    (if ((correctCount x:ℝ)-mean M A B N)/sigma M A B N ≤ z then (1:ℝ) else 0)

def primitiveCdf (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (z : ℝ) : ℝ :=
  ∫ x, (if (((∑ i, (primitiveCounts M N A B x i:ℕ)):ℝ)-mean M A B N)/sigma M A B N ≤ z
    then (1:ℝ) else 0) ∂(primitiveLaw M N).toMeasure

theorem primitive_cdf_eq (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (z : ℝ) :
    primitiveCdf M A B N z=cdf M A B N z := by
  let f : (∀ i : Fin M.base.K, Fin (sizes M N i+1)) → ℝ := fun k =>
    if (((∑ i, (k i:ℕ)):ℝ)-mean M A B N)/sigma M A B N ≤ z then 1 else 0
  change (∫ x, f (primitiveCounts M N A B x) ∂(primitiveLaw M N).toMeasure)=_
  rw [primitive_law_count_expectation M N A B f]
  symm
  simpa only [cdf, weights, correctCount, count, f, Nat.cast_sum] using
    joint_count_pushforward (sizes M N) (q M A B) f

theorem lower_cut (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (hN : 0<N)
    (z : ℝ) (hz : z<threshold M A B N) : cdf M A B N z ≤ binomialError M N A B := by
  rw [conditional_member_error]
  apply Finset.sum_le_sum
  intro x _
  exact mul_le_mul_of_nonneg_left
    (Obligations046.Threshold.lower_cut_pointwise _ _ _ _ _ (sigma_pos M A B N hN) hz)
    (weights_nonneg M A B N x)

theorem upper_cut (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) (hN : 0<N)
    (z : ℝ) (hz : threshold M A B N<z) : binomialError M N A B ≤ cdf M A B N z := by
  rw [conditional_member_error]
  apply Finset.sum_le_sum
  intro x _
  exact mul_le_mul_of_nonneg_left
    (Obligations046.Threshold.upper_cut_pointwise _ _ _ _ _ (sigma_pos M A B N hN) hz)
    (weights_nonneg M A B N x)

/-- CONDITIONAL transfer only. The fixed-cut CDF limit hCLT is an explicit
unpaid hypothesis; Lindeberg vanishing is not silently used as a CLT theorem. -/
theorem diagonal_transfer_of_fixed_cut_limits (M : Model) (A : Ancestors M) (B : Leaves M)
    (hdiag : score M A B=(1:ℝ)/2) (F : ℝ→ℝ) (hF : ContinuousAt F 0)
    (hCLT : ∀ z, Tendsto (fun N => primitiveCdf M A B N z) atTop (𝓝 (F z))) :
    Tendsto (fun N => binomialError M N A B) atTop (𝓝 (F 0)) := by
  apply Obligations046.Threshold.moving_cut_sandwich (cdf M A B) F (threshold M A B)
    (fun N => binomialError M N A B) hF
    (fun z => by simpa only [primitive_cdf_eq] using hCLT z) (threshold_limit M A B hdiag)
  · filter_upwards [eventually_ge_atTop 1] with N hN
    exact lower_cut M A B N (by omega)
  · filter_upwards [eventually_ge_atTop 1] with N hN
    exact upper_cut M A B N (by omega)

/-- A two-level model with a genuine positive-mass diagonal latent state. -/
def exampleModel : Model where
  base := {
    K := 1
    K_pos := by norm_num
    p := 3/4
    c := 1/5
    p_half := by norm_num
    p_lt_one := by norm_num
    c_nonneg := by norm_num
    c_lt_one := by norm_num
    w := fun _ => 1
    w_nonneg := fun _ => by norm_num
    weights_sum := by norm_num [Finset.sum_range_succ] }
  ancestors := 1
  parent := fun _ => 0
  c2 := 1/6
  c2_nonneg := by norm_num
  c2_lt_one := by norm_num

/-- All four latent states: one unbiased diagonal, three off-diagonal. -/
theorem example_regions (A : Ancestors exampleModel) (B : Leaves exampleModel) :
    score exampleModel A B ≠ (1:ℝ)/2 ∨ ∀ i, q exampleModel A B i=(1:ℝ)/2 := by
  change (∑ i : Fin 1, (1:ℝ)*success (3/4) (1/5) (1/6) (A (0:Fin 1)) (B i)) ≠ 1/2 ∨
    ∀ i : Fin 1, success (3/4) (1/5) (1/6) (A (0:Fin 1)) (B i)=1/2
  cases ha : A (0:Fin 1) <;> cases hb : B (0:Fin 1)
  · right
    intro i
    have hi : i=(0:Fin 1) := Fin.eq_zero i
    subst i
    norm_num [success, ha, hb]
  all_goals
    left
    norm_num [success, Fin.sum_univ_succ, ha, hb]

theorem example_generator_limit :
    Tendsto (fun N : ℕ => ∫ x, Obligations045.M0.fairLoss
      (∑ i, (primitiveCounts exampleModel N x.1.1 x.1.2 x.2 i:ℕ)) N
      ∂(fullLaw exampleModel N).toMeasure) atTop (𝓝 (thresholdFunctional exampleModel)) :=
  generator_limit_offdiag_or_unbiased exampleModel example_regions

/-- Enumerate functions on one named origin, without a finite-grid assumption on probabilities. -/
theorem sum_one_bit (f : (Fin 1→Bool)→ℝ) :
    (∑ a : Fin 1→Bool, f a)=f (fun _ => false)+f (fun _ => true) := by
  have hbij : Function.Bijective (fun a : Fin 1→Bool => a 0) := by
    constructor
    · intro a b hab
      funext i
      rw [Fin.eq_zero i]
      exact hab
    · intro b
      exact ⟨fun _ => b, rfl⟩
  have h := Fintype.sum_bijective (fun a : Fin 1→Bool => a 0) hbij f
    (fun b => f (fun _ => b)) (fun a => congrArg f (funext (fun i => congrArg a (Fin.eq_zero i))))
  simpa only [Fintype.sum_bool, add_comm] using h

theorem example_threshold_exact : thresholdFunctional exampleModel=(1:ℝ)/32 := by
  change (∑ A : Fin 1→Bool, ∑ B : Fin 1→Bool,
    ((∏ g : Fin 1, bernMass (3/4) (A g))*(∏ i : Fin 1, bernMass (3/4) (B i)))*
      Obligations045.M0.limitingLoss (∑ i : Fin 1,
        (1:ℝ)*success (3/4) (1/5) (1/6) (A (0:Fin 1)) (B i))) = 1/32
  rw [sum_one_bit]
  simp only [sum_one_bit]
  norm_num [Fin.sum_univ_succ, Fin.prod_univ_succ, bernMass, success, Obligations045.M0.limitingLoss]

theorem example_generator_limit_exact :
    Tendsto (fun N : ℕ => ∫ x, Obligations045.M0.fairLoss
      (∑ i, (primitiveCounts exampleModel N x.1.1 x.1.2 x.2 i:ℕ)) N
      ∂(fullLaw exampleModel N).toMeasure) atTop (𝓝 ((1:ℝ)/32)) := by
  simpa only [example_threshold_exact] using example_generator_limit

end Obligations046.M1Diagonal
