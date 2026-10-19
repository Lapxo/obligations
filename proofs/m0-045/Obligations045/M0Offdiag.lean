import Obligations045.M0Limit
import Mathlib.Probability.StrongLaw
import Mathlib.MeasureTheory.Integral.DominatedConvergence
open scoped BigOperators
open Filter Topology MeasureTheory ProbabilityTheory
noncomputable section
namespace Obligations045.M0

theorem floor_quota_bounds (M : Domain) (N i : ℕ) :
    (∑ j ∈ Finset.range M.K, allocation M.w N j = N) ∧
    (-1 < (allocation M.w N i : ℝ)-(N:ℝ)*M.w i ∧
      (allocation M.w N i : ℝ)-(N:ℝ)*M.w i < 1) :=
  ⟨allocation_sum M N, allocation_discrepancy M N i⟩

theorem allocation_ratio (M : Domain) (i : ℕ) :
    Tendsto (fun N : ℕ => (allocation M.w N i : ℝ)/(N:ℝ)) atTop (𝓝 (M.w i)) := by
  have hInv : Tendsto (fun N : ℕ => (1:ℝ)/(N:ℝ)) atTop (𝓝 0) :=
    tendsto_const_nhds.div_atTop tendsto_natCast_atTop_atTop
  apply tendsto_of_tendsto_of_tendsto_of_le_of_le'
    (by simpa using tendsto_const_nhds.sub hInv)
    (by simpa using tendsto_const_nhds.add hInv)
  · filter_upwards [eventually_ge_atTop 1] with N hN
    have hp : 0 < (N:ℝ) := by exact_mod_cast (lt_of_lt_of_le Nat.zero_lt_one hN)
    rw [le_div_iff₀ hp, sub_mul, inv_mul_cancel₀ hp.ne']
    linarith [(allocation_discrepancy M N i).1]
  · filter_upwards [eventually_ge_atTop 1] with N hN
    have hp : 0 < (N:ℝ) := by exact_mod_cast (lt_of_lt_of_le Nat.zero_lt_one hN)
    rw [div_le_iff₀ hp, add_mul, inv_mul_cancel₀ hp.ne']
    linarith [(allocation_discrepancy M N i).2]

theorem allocation_zero (M : Domain) (i : ℕ) (hw : M.w i = 0) (N : ℕ) :
    allocation M.w N i = 0 := by
  simp [allocation, prefix_succ, hw]

theorem allocation_atTop (M : Domain) (i : ℕ) (hw : 0 < M.w i) :
    Tendsto (fun N => allocation M.w N i) atTop atTop := by
  apply (tendsto_natCast_atTop_iff (R := ℝ)).mp
  apply tendsto_atTop.2
  intro r
  have he : ∀ᶠ N : ℕ in atTop, (r+1)/M.w i ≤ (N:ℝ) :=
    tendsto_natCast_atTop_atTop.eventually (eventually_ge_atTop _)
  filter_upwards [he] with N hN
  have hmul := (div_le_iff₀ hw).mp hN
  linarith [(allocation_discrepancy M N i).1]

theorem lineage_quota_limit (M : Domain) (i : ℕ) (z : ℕ → ℝ) (q : ℝ)
    (hz0 : z 0 = 0)
    (hz : Tendsto (fun n : ℕ => z n/(n:ℝ)) atTop (𝓝 q)) :
    Tendsto (fun N : ℕ => z (allocation M.w N i)/(N:ℝ)) atTop (𝓝 (M.w i*q)) := by
  by_cases hw : M.w i = 0
  · simp [allocation_zero M i hw, hz0, hw]
  · have hp : 0 < M.w i := lt_of_le_of_ne (M.w_nonneg i) (Ne.symm hw)
    have h := (allocation_ratio M i).mul (hz.comp (allocation_atTop M i hp))
    convert h using 1
    funext N
    by_cases hn : allocation M.w N i = 0
    · simp [hn, hz0]
    · dsimp
      rw [div_mul_div_comm, mul_comm (allocation M.w N i : ℝ), mul_div_mul_right _ _ (by exact_mod_cast hn : (allocation M.w N i : ℝ) ≠ 0)]

/-- The imported strong law is applied to actual lineage variables; no convergence certificate. -/
theorem lineage_lgn {Ω : Type*} [MeasurableSpace Ω] (μ : Measure Ω)
    (X : ℕ → Ω → ℝ) (q : ℝ)
    (hint : Integrable (X 0) μ)
    (hindep : Pairwise (fun i j : ℕ => IndepFun (X i) (X j) μ))
    (hident : ∀ i, IdentDistrib (X i) (X 0) μ μ)
    (hmean : ∫ ω, X 0 ω ∂μ = q) :
    ∀ᵐ ω ∂μ, Tendsto (fun n : ℕ => (∑ j ∈ Finset.range n, X j ω)/(n:ℝ))
      atTop (𝓝 q) := by
  simpa only [hmean] using strong_law_ae_real X hint hindep hident

def memberAverage {Ω : Type*} (M : Domain) (X : Fin M.K → ℕ → Ω → ℝ)
    (N : ℕ) (ω : Ω) : ℝ :=
  ∑ i : Fin M.K, (∑ j ∈ Finset.range (allocation M.w N i), X i j ω)/(N:ℝ)

theorem member_average_lgn {Ω : Type*} [MeasurableSpace Ω]
    (M : Domain) (a : Fin M.K → Bool) (μ : Measure Ω)
    (X : Fin M.K → ℕ → Ω → ℝ)
    (hint : ∀ i, Integrable (X i 0) μ)
    (hindep : ∀ i, Pairwise (fun j k : ℕ => IndepFun (X i j) (X i k) μ))
    (hident : ∀ i j, IdentDistrib (X i j) (X i 0) μ μ)
    (hmean : ∀ i, ∫ ω, X i 0 ω ∂μ = q M (a i)) :
    ∀ᵐ ω ∂μ, Tendsto (fun N => memberAverage M X N ω) atTop (𝓝 (score M a)) := by
  have hall : ∀ᵐ ω ∂μ, ∀ i : Fin M.K,
      Tendsto (fun n : ℕ => (∑ j ∈ Finset.range n, X i j ω)/(n:ℝ))
        atTop (𝓝 (q M (a i))) := by
    rw [ae_all_iff]
    intro i
    exact lineage_lgn μ (X i) (q M (a i)) (hint i) (hindep i) (hident i) (hmean i)
  filter_upwards [hall] with ω hω
  unfold memberAverage score
  apply tendsto_finset_sum
  intro i _
  exact lineage_quota_limit M i (fun n => ∑ j ∈ Finset.range n, X i j ω)
    (q M (a i)) (by simp) (hω i)

theorem floor_limit_offdiag_scalar {f : ℕ → ℝ} {s : ℝ}
    (hf : Tendsto f atTop (𝓝 s)) (hne : s ≠ (1:ℝ)/2) :
    Tendsto (fun N => limitingLoss (f N)) atTop (𝓝 (limitingLoss s)) := by
  by_cases hs : s < (1:ℝ)/2
  · have he : ∀ᶠ N in atTop, f N < (1:ℝ)/2 := hf.eventually (Iio_mem_nhds hs)
    have hEq : (fun N => limitingLoss (f N)) =ᶠ[atTop] (fun _ => (1:ℝ)) :=
      he.mono (fun N hN => by change limitingLoss (f N) = 1; rw [limitingLoss, if_pos hN])
    rw [limitingLoss, if_pos hs]
    exact tendsto_const_nhds.congr' hEq.symm
  · have hg : (1:ℝ)/2 < s := lt_of_le_of_ne (le_of_not_gt hs) (Ne.symm hne)
    have he : ∀ᶠ N in atTop, (1:ℝ)/2 < f N := hf.eventually (Ioi_mem_nhds hg)
    have hEq : (fun N => limitingLoss (f N)) =ᶠ[atTop] (fun _ => (0:ℝ)) :=
      he.mono (fun N hN => by
        change limitingLoss (f N) = 0
        rw [limitingLoss, if_neg (not_lt.mpr hN.le), if_neg (Ne.symm hN.ne)])
    rw [limitingLoss, if_neg hs, if_neg hne]
    exact tendsto_const_nhds.congr' hEq.symm

/-- Off-diagonal passage from actual sample averages to error probabilities.
    Unlike the diagonal, no CLT is needed. The lineage strong laws and quota
    composition must supply haverage for the chosen M0 array. -/
theorem floor_limit_offdiag {Ω : Type*} [MeasurableSpace Ω]
    (μ : Measure Ω) [IsProbabilityMeasure μ]
    (average : ℕ → Ω → ℝ) (s : ℝ)
    (hmeas : ∀ N, AEStronglyMeasurable (fun ω => limitingLoss (average N ω)) μ)
    (haverage : ∀ᵐ ω ∂μ, Tendsto (fun N => average N ω) atTop (𝓝 s))
    (hne : s ≠ (1:ℝ)/2) :
    Tendsto (fun N => ∫ ω, limitingLoss (average N ω) ∂μ)
      atTop (𝓝 (limitingLoss s)) := by
  have hbound : ∀ N, ∀ᵐ ω ∂μ, ‖limitingLoss (average N ω)‖ ≤ (1:ℝ) := by
    intro N
    filter_upwards [] with ω
    unfold limitingLoss
    split_ifs <;> norm_num
  have hlim : ∀ᵐ ω ∂μ, Tendsto (fun N => limitingLoss (average N ω))
      atTop (𝓝 (limitingLoss s)) := haverage.mono (fun ω hω => floor_limit_offdiag_scalar hω hne)
  simpa using tendsto_integral_of_dominated_convergence (fun _ => (1:ℝ)) hmeas
    (integrable_const (1:ℝ)) hbound hlim

/-- M0 off-diagonal probability limit from declared lineage laws and the proved quotas.
    The only extra technical input is measurability of the loss; no asymptotic
    convergence hypothesis and no CLT certificate is assumed. -/
theorem floor_limit_offdiag_M0 {Ω : Type*} [MeasurableSpace Ω]
    (M : Domain) (a : Fin M.K → Bool) (μ : Measure Ω) [IsProbabilityMeasure μ]
    (X : Fin M.K → ℕ → Ω → ℝ)
    (hint : ∀ i, Integrable (X i 0) μ)
    (hindep : ∀ i, Pairwise (fun j k : ℕ => IndepFun (X i j) (X i k) μ))
    (hident : ∀ i j, IdentDistrib (X i j) (X i 0) μ μ)
    (hmean : ∀ i, ∫ ω, X i 0 ω ∂μ = q M (a i))
    (hmeas : ∀ N, AEStronglyMeasurable (fun ω => limitingLoss (memberAverage M X N ω)) μ)
    (hoff : score M a ≠ (1:ℝ)/2) :
    Tendsto (fun N => ∫ ω, limitingLoss (memberAverage M X N ω) ∂μ)
      atTop (𝓝 (limitingLoss (score M a))) := by
  exact floor_limit_offdiag μ (memberAverage M X) (score M a) hmeas
    (member_average_lgn M a μ X hint hindep hident hmean) hoff

theorem floor_limit_offdiag_mixture {Ω : Type*} [MeasurableSpace Ω]
    (M : Domain) (μ : Measure Ω) [IsProbabilityMeasure μ]
    (X : (Fin M.K → Bool) → Fin M.K → ℕ → Ω → ℝ)
    (hint : ∀ a i, Integrable (X a i 0) μ)
    (hindep : ∀ a i, Pairwise (fun j k : ℕ => IndepFun (X a i j) (X a i k) μ))
    (hident : ∀ a i j, IdentDistrib (X a i j) (X a i 0) μ μ)
    (hmean : ∀ a i, ∫ ω, X a i 0 ω ∂μ = q M (a i))
    (hmeas : ∀ a N, AEStronglyMeasurable (fun ω => limitingLoss (memberAverage M (X a) N ω)) μ)
    (hoff : ∀ a, score M a ≠ (1:ℝ)/2) :
    Tendsto (fun N => ∑ a : Fin M.K → Bool, latentMass M a *
      ∫ ω, limitingLoss (memberAverage M (X a) N ω) ∂μ)
      atTop (𝓝 (floor M)) := by
  unfold floor
  apply tendsto_finset_sum
  intro a _
  exact tendsto_const_nhds.mul (floor_limit_offdiag_M0 M a μ (X a)
    (hint a) (hindep a) (hident a) (hmean a) (hmeas a) (hoff a))

end Obligations045.M0
