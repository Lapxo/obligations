import M1Bridge046
import M0Moments046

open scoped BigOperators
open Filter Topology MeasureTheory ProbabilityTheory
noncomputable section
open Classical Obligations046.M1Bridge Obligations046.Bridge
namespace Obligations046.M1Offdiag

/-- Actual finite conditional mean and variance; no convergence premise. -/
def mean (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) : ℝ :=
  ∑ i : Fin M.base.K, (sizes M N i : ℝ)*q M A B i
def variance (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) : ℝ :=
  ∑ i : Fin M.base.K, (sizes M N i : ℝ)*q M A B i*(1-q M A B i)
def score (M : Model) (A : Ancestors M) (B : Leaves M) : ℝ :=
  ∑ i : Fin M.base.K, M.base.w i*q M A B i

theorem q_bounds (M : Model) (A : Ancestors M) (B : Leaves M) (i : Fin M.base.K) :
    0 ≤ q M A B i ∧ q M A B i ≤ 1 := by
  have hn (e : Fin 4) : 0 ≤ branchMass M.base.p M.base.c M.c2 e :=
    branch_nonneg _ _ _ (by linarith [M.base.p_half]) M.base.p_lt_one.le
      M.base.c_nonneg M.base.c_lt_one.le M.c2_nonneg M.c2_lt_one.le e
  have ht : 0 ≤ ∑ e : Fin 4, if branchBit (A (M.parent i)) (B i) e = true
      then branchMass M.base.p M.base.c M.c2 e else 0 := by
    apply Finset.sum_nonneg
    intro e _
    split_ifs
    · exact hn e
    · exact le_rfl
  have hf : 0 ≤ ∑ e : Fin 4, if branchBit (A (M.parent i)) (B i) e = false
      then branchMass M.base.p M.base.c M.c2 e else 0 := by
    apply Finset.sum_nonneg
    intro e _
    split_ifs
    · exact hn e
    · exact le_rfl
  rw [branch_bit_fiber] at ht hf
  change 0 ≤ q M A B i at ht
  change 0 ≤ 1-q M A B i at hf
  exact ⟨ht, by linarith⟩

theorem mean_ratio_limit (M : Model) (A : Ancestors M) (B : Leaves M) :
    Tendsto (fun N : ℕ => mean M A B N/(N:ℝ)) atTop (𝓝 (score M A B)) := by
  have h := tendsto_finset_sum Finset.univ (fun (i : Fin M.base.K) _ =>
    (Obligations045.M0.allocation_ratio M.base i).mul_const (q M A B i))
  convert h using 1
  funext N
  simp only [mean, score, Finset.sum_div, div_mul_eq_mul_div]

theorem variance_le (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) :
    variance M A B N ≤ (N:ℝ)/4 := by
  have hs : ∑ i : Fin M.base.K, (sizes M N i : ℝ) = (N:ℝ) := by
    exact_mod_cast (by simpa only [Fin.sum_univ_eq_sum_range] using
      Obligations045.M0.allocation_sum M.base N)
  calc
    _ ≤ ∑ i : Fin M.base.K, (sizes M N i : ℝ)*(1/4) := by
      apply Finset.sum_le_sum
      intro i _
      have h : q M A B i*(1-q M A B i) ≤ 1/4 := by
        nlinarith [sq_nonneg (q M A B i-1/2)]
      simpa only [mul_assoc] using mul_le_mul_of_nonneg_left h (Nat.cast_nonneg (sizes M N i))
    _ = _ := by rw [← Finset.sum_mul, hs]; ring

/-- Off-diagonal loss is locally constant; only a squared deviation can change it. -/
theorem loss_left_bound (x m eps : ℝ) (he : 0 < eps) (hm : m+eps ≤ 1/2) :
    |Obligations045.M0.limitingLoss x-1| ≤ (x-m)^2/eps^2 := by
  by_cases hx : x < (1:ℝ)/2
  · simp only [Obligations045.M0.limitingLoss, if_pos hx, sub_self, abs_zero]
    positivity
  · have hx' : (1:ℝ)/2 ≤ x := le_of_not_gt hx
    have hd : eps^2 ≤ (x-m)^2 := by
      nlinarith [sq_nonneg (x-m-eps)]
    have hu : (1:ℝ) ≤ (x-m)^2/eps^2 := by
      exact (le_div_iff₀ (sq_pos_of_pos he)).mpr (by simpa using hd)
    have hb : |Obligations045.M0.limitingLoss x-1| ≤ 1 := by
      unfold Obligations045.M0.limitingLoss
      split_ifs <;> norm_num [abs_div]
    exact hb.trans hu

theorem loss_right_bound (x m eps : ℝ) (he : 0 < eps) (hm : 1/2 ≤ m-eps) :
    |Obligations045.M0.limitingLoss x| ≤ (x-m)^2/eps^2 := by
  by_cases hx : (1:ℝ)/2 < x
  · have hn : ¬ x < (1:ℝ)/2 := not_lt.mpr hx.le
    simp only [Obligations045.M0.limitingLoss, if_neg hn, if_neg (Ne.symm hx.ne), abs_zero]
    positivity
  · have hx' : x ≤ (1:ℝ)/2 := le_of_not_gt hx
    have hd : eps^2 ≤ (x-m)^2 := by
      nlinarith [sq_nonneg (m-x-eps)]
    have hu : (1:ℝ) ≤ (x-m)^2/eps^2 := by
      exact (le_div_iff₀ (sq_pos_of_pos he)).mpr (by simpa using hd)
    have hb : |Obligations045.M0.limitingLoss x| ≤ 1 := by
      unfold Obligations045.M0.limitingLoss
      split_ifs <;> norm_num [abs_div]
    exact hb.trans hu

abbrev members (M : Model) (N : ℕ) := World (sizes M N)
def weights (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ)
    (x : members M N) := jointMass (sizes M N) (q M A B) x

theorem weights_nonneg (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ)
    (x : members M N) : 0 ≤ weights M A B N x := by
  unfold weights jointMass
  exact Finset.prod_nonneg (fun i _ => mass_nonneg _ (q_bounds M A B i).1
    (q_bounds M A B i).2 (x i))

theorem weights_sum (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) :
    ∑ x : members M N, weights M A B N x = 1 := jointMass_sum _ _

theorem conditional_member_error (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) :
    binomialError M N A B = ∑ x : members M N, weights M A B N x*
      Obligations045.M0.fairLoss (correctCount x) N := by
  symm
  simpa only [weights, binomialError, correctCount, count] using
    joint_count_pushforward (sizes M N) (q M A B)
      (fun k => Obligations045.M0.fairLoss (∑ i, (k i : ℕ)) N)

theorem centered_second (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ) :
    (∑ x : members M N, weights M A B N x*((correctCount x:ℝ)-mean M A B N)^2) =
      variance M A B N := by
  have h := Obligations046.Moments.member_total_centered_second (sizes M N) (q M A B)
    (fun i => (q_bounds M A B i).1) (fun i => (q_bounds M A B i).2)
  rw [memberLaw_expectation] at h
  exact h

/-- A direct finite Chebyshev bound. The test function is bounded POINTWISE; no
independence between pair scores, ambient process, CLT or limit is assumed. -/
theorem conditional_gap_bound (M : Model) (A : Ancestors M) (B : Leaves M) (N : ℕ)
    (hN : 0 < N) (eps target : ℝ) (he : 0 < eps)
    (hpoint : ∀ x : ℝ, |Obligations045.M0.limitingLoss x-target| ≤
      (x-mean M A B N/(N:ℝ))^2/eps^2) :
    |binomialError M N A B-target| ≤ 1/(4*(N:ℝ)*eps^2) := by
  have hn : (0:ℝ) < N := by exact_mod_cast hN
  have hd : 0 < (N:ℝ)^2*eps^2 := by positivity
  have hnorm := weights_sum M A B N
  have hrew : binomialError M N A B-target =
      ∑ x : members M N, weights M A B N x*(Obligations045.M0.fairLoss (correctCount x) N-target) := by
    rw [conditional_member_error]
    simp only [mul_sub, Finset.sum_sub_distrib, ← Finset.sum_mul, hnorm, one_mul]
  rw [hrew]
  calc
    _ ≤ ∑ x : members M N, |weights M A B N x*
        (Obligations045.M0.fairLoss (correctCount x) N-target)| := Finset.abs_sum_le_sum_abs _ _
    _ = ∑ x : members M N, weights M A B N x*
        |Obligations045.M0.fairLoss (correctCount x) N-target| := by
      apply Finset.sum_congr rfl
      intro x _
      rw [abs_mul, abs_of_nonneg (weights_nonneg M A B N x)]
    _ ≤ ∑ x : members M N, weights M A B N x*
        (((correctCount x:ℝ)-mean M A B N)^2/((N:ℝ)^2*eps^2)) := by
      apply Finset.sum_le_sum
      intro x _
      apply mul_le_mul_of_nonneg_left _ (weights_nonneg M A B N x)
      rw [fair_loss_average_bridge _ _ hN]
      have h := hpoint ((correctCount x:ℝ)/(N:ℝ))
      convert h using 1
      field_simp
    _ = variance M A B N/((N:ℝ)^2*eps^2) := by
      simp_rw [← mul_div_assoc]
      rw [← Finset.sum_div, centered_second]
    _ ≤ ((N:ℝ)/4)/((N:ℝ)^2*eps^2) :=
      div_le_div_of_nonneg_right (variance_le M A B N) hd.le
    _ = _ := by field_simp; ring

/-- This positive O(1/N) bound tends to zero with epsilon FIXED. -/
theorem tail_bound_limit (eps : ℝ) :
    Tendsto (fun N : ℕ => 1/(4*(N:ℝ)*eps^2)) atTop (𝓝 0) := by
  have h : Tendsto (fun N : ℕ => (1:ℝ)/(N:ℝ)) atTop (𝓝 0) :=
    tendsto_const_nhds.div_atTop tendsto_natCast_atTop_atTop
  have heq : (fun N : ℕ => 1/(4*(N:ℝ)*eps^2)) =
      (fun N : ℕ => ((1:ℝ)/(N:ℝ))/(4*eps^2)) := by funext N; ring
  rw [heq]
  simpa using h.div_const (4*eps^2)

/-- New finite M1 conditional probability limit, derived from quota convergence
and the finite generator/binomial law; no convergence premise or ambient iid oracle. -/
theorem conditional_offdiag_limit (M : Model) (A : Ancestors M) (B : Leaves M)
    (hoff : score M A B ≠ (1:ℝ)/2) :
    Tendsto (fun N : ℕ => binomialError M N A B) atTop
      (𝓝 (Obligations045.M0.limitingLoss (score M A B))) := by
  by_cases hs : score M A B < (1:ℝ)/2
  · let eps : ℝ := (1/2-score M A B)/2
    have he : 0 < eps := by dsimp [eps]; linarith
    have hm : ∀ᶠ N in atTop, mean M A B N/(N:ℝ)+eps ≤ (1:ℝ)/2 := by
      have h := (mean_ratio_limit M A B).eventually
        (Iio_mem_nhds (show score M A B < (1:ℝ)/2-eps by dsimp [eps]; linarith))
      filter_upwards [h] with N hN
      linarith
    have hb : ∀ᶠ N in atTop, |binomialError M N A B-1| ≤ 1/(4*(N:ℝ)*eps^2) := by
      filter_upwards [hm, eventually_ge_atTop 1] with N hm hN
      exact conditional_gap_bound M A B N (by omega) eps 1 he
        (fun x => loss_left_bound x _ eps he hm)
    have h := squeeze_zero' (Eventually.of_forall (fun N => abs_nonneg (binomialError M N A B-1))) hb
      (tail_bound_limit eps)
    rw [Obligations045.M0.limitingLoss, if_pos hs]
    exact (tendsto_iff_norm_sub_tendsto_zero).mpr (by simpa only [Real.norm_eq_abs] using h)
  · have hs' : (1:ℝ)/2 < score M A B := lt_of_le_of_ne (le_of_not_gt hs) (Ne.symm hoff)
    let eps : ℝ := (score M A B-1/2)/2
    have he : 0 < eps := by dsimp [eps]; linarith
    have hm : ∀ᶠ N in atTop, (1:ℝ)/2 ≤ mean M A B N/(N:ℝ)-eps := by
      have h := (mean_ratio_limit M A B).eventually
        (Ioi_mem_nhds (show (1:ℝ)/2+eps < score M A B by dsimp [eps]; linarith))
      filter_upwards [h] with N hN
      linarith
    have hb : ∀ᶠ N in atTop, |binomialError M N A B| ≤ 1/(4*(N:ℝ)*eps^2) := by
      filter_upwards [hm, eventually_ge_atTop 1] with N hm hN
      simpa only [sub_zero] using conditional_gap_bound M A B N (by omega) eps 0 he
        (fun x => by simpa only [sub_zero] using loss_right_bound x _ eps he hm)
    have h := squeeze_zero' (Eventually.of_forall (fun N => abs_nonneg (binomialError M N A B))) hb
      (tail_bound_limit eps)
    rw [Obligations045.M0.limitingLoss, if_neg hs, if_neg hoff]
    exact (tendsto_iff_norm_sub_tendsto_zero).mpr (by simpa only [Real.norm_eq_abs, sub_zero] using h)

def thresholdFunctional (M : Model) : ℝ :=
  ∑ A : Ancestors M, ∑ B : Leaves M,
    latentMass M A B * Obligations045.M0.limitingLoss (score M A B)

/-- All latent configurations are positive mass forp in(1/2,1). No diagonal
configuration is silently discarded or called a fork. -/
theorem implementation_offdiag_limit (M : Model)
    (hoff : ∀ (A : Ancestors M) (B : Leaves M), score M A B ≠ (1:ℝ)/2) :
    Tendsto (implementationError M) atTop (𝓝 (thresholdFunctional M)) := by
  unfold implementationError thresholdFunctional
  apply tendsto_finset_sum
  intro A _
  apply tendsto_finset_sum
  intro B _
  exact tendsto_const_nhds.mul (conditional_offdiag_limit M A B (hoff A B))

/-- Limit of the ACTUAL full generator probabilities via the admitted exact bridge. -/
theorem generator_offdiag_limit (M : Model)
    (hoff : ∀ (A : Ancestors M) (B : Leaves M), score M A B ≠ (1:ℝ)/2) :
    Tendsto (fun N : ℕ => ∫ x, Obligations045.M0.fairLoss
      (∑ i, (primitiveCounts M N x.1.1 x.1.2 x.2 i : ℕ)) N ∂(fullLaw M N).toMeasure)
      atTop (𝓝 (thresholdFunctional M)) := by
  simpa only [full_generator_error_bridge] using implementation_offdiag_limit M hoff

/-- The existing exact shared-parent example: genuinely nonzero rates on both levels. -/
def exampleModel : Model where
  base := {
    K := 2
    K_pos := by norm_num
    p := 2/3
    c := 1/2
    p_half := by norm_num
    p_lt_one := by norm_num
    c_nonneg := by norm_num
    c_lt_one := by norm_num
    w := fun _ => 1/2
    w_nonneg := fun _ => by norm_num
    weights_sum := by norm_num [Finset.sum_range_succ] }
  ancestors := 1
  parent := fun _ => 0
  c2 := 1/2
  c2_nonneg := by norm_num
  c2_lt_one := by norm_num

theorem example_offdiag (A : Ancestors exampleModel) (B : Leaves exampleModel) :
    score exampleModel A B ≠ (1:ℝ)/2 := by
  change (∑ i : Fin 2, (1/2:ℝ)*success (2/3) (1/2) (1/2) (A (0:Fin 1)) (B i)) ≠ 1/2
  cases ha : A (0:Fin 1) <;> cases hb : B (0:Fin 2) <;> cases hc : B (1:Fin 2) <;>
    norm_num [success, Fin.sum_univ_succ, ha, hb, hc]

theorem example_generator_limit :
    Tendsto (fun N : ℕ => ∫ x, Obligations045.M0.fairLoss
      (∑ i, (primitiveCounts exampleModel N x.1.1 x.1.2 x.2 i : ℕ)) N
      ∂(fullLaw exampleModel N).toMeasure)
      atTop (𝓝 (thresholdFunctional exampleModel)) :=
  generator_offdiag_limit exampleModel example_offdiag

end Obligations046.M1Offdiag
