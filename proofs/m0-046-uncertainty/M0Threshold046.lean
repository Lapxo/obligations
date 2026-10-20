import M0Lindeberg046
open scoped BigOperators
open Filter Topology MeasureTheory
noncomputable section
open Classical Obligations045.M0 Obligations046.Bridge Obligations046.Diagonal
namespace Obligations046.Threshold

/-- Threshold transfer, explicitly conditional on all fixed-cut distribution limits.
This is not a construction of a CLT or an M0 diagonal theorem. -/
theorem moving_cut_sandwich (C : ℕ → ℝ → ℝ) (F : ℝ → ℝ)
    (t v : ℕ → ℝ) (hF : ContinuousAt F 0)
    (hC : ∀ z, Tendsto (fun N => C N z) atTop (𝓝 (F z)))
    (ht : Tendsto t atTop (𝓝 0))
    (hl : ∀ᶠ N in atTop, ∀ z, z < t N → C N z ≤ v N)
    (hu : ∀ᶠ N in atTop, ∀ z, t N < z → v N ≤ C N z) :
    Tendsto v atTop (𝓝 (F 0)) := by
  have hinv : Tendsto (fun j : ℕ => (1:ℝ)/((j:ℝ)+1)) atTop (𝓝 0) :=
    tendsto_const_nhds.div_atTop (tendsto_atTop_mono
      (fun j : ℕ => show (j:ℝ) ≤ (j:ℝ)+1 by linarith)
      tendsto_natCast_atTop_atTop)
  have hleft : Tendsto (fun j : ℕ => F (-((1:ℝ)/((j:ℝ)+1)))) atTop (𝓝 (F 0)) := by
    exact hF.tendsto.comp (by simpa only [neg_zero] using hinv.neg)
  have hright : Tendsto (fun j : ℕ => F ((1:ℝ)/((j:ℝ)+1))) atTop (𝓝 (F 0)) :=
    hF.tendsto.comp hinv
  apply tendsto_order.2
  constructor
  · intro b hb
    obtain ⟨j,hj⟩ := (hleft.eventually (Ioi_mem_nhds hb)).exists
    let δ : ℝ := (1:ℝ)/((j:ℝ)+1)
    have hd : 0 < δ := by dsimp [δ]; positivity
    have he := (hC (-δ)).eventually (Ioi_mem_nhds hj)
    have hth := ht.eventually (Ioi_mem_nhds (show -δ < (0:ℝ) by linarith))
    filter_upwards [he,hth,hl] with N hN htN hlN
    exact lt_of_lt_of_le hN (hlN (-δ) htN)
  · intro b hb
    obtain ⟨j,hj⟩ := (hright.eventually (Iio_mem_nhds hb)).exists
    let δ : ℝ := (1:ℝ)/((j:ℝ)+1)
    have hd : 0 < δ := by dsimp [δ]; positivity
    have he := (hC δ).eventually (Iio_mem_nhds hj)
    have hth := ht.eventually (Iio_mem_nhds hd)
    filter_upwards [he,hth,hu] with N hN htN huN
    exact lt_of_le_of_lt (huN δ htN) hN

def sigma (M : Domain) (a : Fin M.K → Bool) (N : ℕ) : ℝ :=
  Real.sqrt (Obligations046.Diagonal.variance M a N)
def threshold (M : Domain) (a : Fin M.K → Bool) (N : ℕ) : ℝ :=
  ((N:ℝ)/2-mean M a N)/sigma M a N

theorem sigma_pos (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (hN : 0<N) :
    0 < sigma M a N := by
  apply Real.sqrt_pos.2
  exact lt_of_lt_of_le (mul_pos (by exact_mod_cast hN) (variance_lower_pos M))
    (finite_variance_lower M a N)

theorem threshold_limit (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) :
    Tendsto (threshold M a) atTop (𝓝 0) := by
  have h := Obligations046.Lindeberg.actual_mean_standardized_drift M a hdiag
  apply (tendsto_zero_iff_norm_tendsto_zero).mpr
  simpa only [threshold, sigma, Real.norm_eq_abs, abs_div,
    abs_of_nonneg (Real.sqrt_nonneg _), abs_sub_comm,
    Obligations046.Moments.model_mean, Obligations046.Moments.model_variance] using h

/-- This CDF uses the actual joint member law; the cut is in standard-deviation units. -/
def cdf (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (z : ℝ) : ℝ :=
  ∫ x, (if ((correctCount x:ℝ)-mean M a N)/sigma M a N ≤ z then (1:ℝ) else 0)
    ∂(modelLaw M N a).toMeasure

theorem fair_loss_bounds (b N : ℕ) : 0 ≤ fairLoss b N ∧ fairLoss b N ≤ 1 := by
  unfold fairLoss
  split_ifs <;> norm_num

theorem lower_cut_pointwise (b N : ℕ) (μ σ z : ℝ) (hσ : 0<σ)
    (hz : z < ((N:ℝ)/2-μ)/σ) :
    (if ((b:ℝ)-μ)/σ ≤ z then (1:ℝ) else 0) ≤ fairLoss b N := by
  split_ifs with hb
  · have hreal : (b:ℝ)<(N:ℝ)/2 := by
      have := (div_le_iff₀ hσ).mp hb
      have := (lt_div_iff₀ hσ).mp hz
      nlinarith
    have hn : 2*b<N := by exact_mod_cast (show (2:ℝ)*(b:ℝ)<(N:ℝ) by linarith)
    simp [fairLoss, hn]
  · exact (fair_loss_bounds b N).1

theorem upper_cut_pointwise (b N : ℕ) (μ σ z : ℝ) (hσ : 0<σ)
    (hz : ((N:ℝ)/2-μ)/σ < z) :
    fairLoss b N ≤ (if ((b:ℝ)-μ)/σ ≤ z then (1:ℝ) else 0) := by
  split_ifs with hb
  · exact (fair_loss_bounds b N).2
  · have hreal : (N:ℝ)/2 < (b:ℝ) := by
      have := (div_lt_iff₀ hσ).mp hz
      have := (lt_div_iff₀ hσ).mp (lt_of_not_ge hb)
      nlinarith
    have hn : N<2*b := by exact_mod_cast (show (N:ℝ)<(2:ℝ)*(b:ℝ) by linarith)
    simp [fairLoss, not_lt.mpr hn.le, Ne.symm hn.ne]

theorem cdf_finite (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (z : ℝ) :
    cdf M a N z = ∑ x : World (sizes M N), jointMass (sizes M N)
      (fun i => q M (a i)) x *
      (if ((correctCount x:ℝ)-mean M a N)/sigma M a N ≤ z then (1:ℝ) else 0) := by
  rw [cdf, modelLaw, memberLaw_expectation]

theorem error_finite (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    conditionalError M N a = ∑ x : World (sizes M N), jointMass (sizes M N)
      (fun i => q M (a i)) x * fairLoss (correctCount x) N := by
  rw [← conditional_error_representation, modelLaw, memberLaw_expectation]

theorem joint_nonneg (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (x : World (sizes M N)) :
    0 ≤ jointMass (sizes M N) (fun i => q M (a i)) x :=
  Finset.prod_nonneg (fun i _ => mass_nonneg _ (q_pos M (a i)).le (q_lt_one M (a i)).le _)

theorem lower_cut (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (hN : 0<N)
    (z : ℝ) (hz : z < threshold M a N) : cdf M a N z ≤ conditionalError M N a := by
  rw [cdf_finite, error_finite]
  apply Finset.sum_le_sum
  intro x _
  exact mul_le_mul_of_nonneg_left
    (lower_cut_pointwise _ _ _ _ _ (sigma_pos M a N hN) hz) (joint_nonneg M a N x)

theorem upper_cut (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (hN : 0<N)
    (z : ℝ) (hz : threshold M a N < z) : conditionalError M N a ≤ cdf M a N z := by
  rw [cdf_finite, error_finite]
  apply Finset.sum_le_sum
  intro x _
  exact mul_le_mul_of_nonneg_left
    (upper_cut_pointwise _ _ _ _ _ (sigma_pos M a N hN) hz) (joint_nonneg M a N x)

/-- Actual finite M0 law, actual majority with fair ties, unchanged quota rule.
The fixed-cut limit hCLT remains an explicit unpaid hypothesis, not a law claim. -/
theorem diagonal_transfer_of_fixed_cut_limits (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) (F : ℝ → ℝ) (hF : ContinuousAt F 0)
    (hCLT : ∀ z, Tendsto (fun N => cdf M a N z) atTop (𝓝 (F z))) :
    Tendsto (fun N => conditionalError M N a) atTop (𝓝 (F 0)) := by
  apply moving_cut_sandwich (cdf M a) F (threshold M a)
    (fun N => conditionalError M N a) hF hCLT (threshold_limit M a hdiag)
  · filter_upwards [eventually_ge_atTop 1] with N hN
    exact lower_cut M a N (by omega)
  · filter_upwards [eventually_ge_atTop 1] with N hN
    exact upper_cut M a N (by omega)

def strictCdf (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (z : ℝ) : ℝ :=
  ∑ x : World (sizes M N), jointMass (sizes M N) (fun i => q M (a i)) x *
    (if ((correctCount x:ℝ)-mean M a N)/sigma M a N < z then (1:ℝ) else 0)

theorem cdf_mono (M : Domain) (a : Fin M.K → Bool) (N : ℕ) :
    Monotone (cdf M a N) := by
  intro z y hzy
  rw [cdf_finite, cdf_finite]
  apply Finset.sum_le_sum
  intro x _
  apply mul_le_mul_of_nonneg_left _ (joint_nonneg M a N x)
  split_ifs <;> norm_num
  linarith

theorem strict_lower_cut (M : Domain) (a : Fin M.K → Bool) (N : ℕ)
    (z t : ℝ) (hzt : z<t) : cdf M a N z ≤ strictCdf M a N t := by
  rw [cdf_finite, strictCdf]
  apply Finset.sum_le_sum
  intro x _
  apply mul_le_mul_of_nonneg_left _ (joint_nonneg M a N x)
  split_ifs <;> norm_num
  linarith

theorem strict_upper_cut (M : Domain) (a : Fin M.K → Bool) (N : ℕ)
    (t z : ℝ) (htz : t<z) : strictCdf M a N t ≤ cdf M a N z := by
  rw [cdf_finite, strictCdf]
  apply Finset.sum_le_sum
  intro x _
  apply mul_le_mul_of_nonneg_left _ (joint_nonneg M a N x)
  split_ifs <;> norm_num
  linarith

/-- Both versions at the moving threshold have the same limit, only IF fixed-cut
convergence to a continuous distribution is supplied. No atomless-limit axiom. -/
theorem threshold_cdf_limits_of_fixed_cut_limits (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) (F : ℝ → ℝ) (hF : ContinuousAt F 0)
    (hCLT : ∀ z, Tendsto (fun N => cdf M a N z) atTop (𝓝 (F z))) :
    Tendsto (fun N => cdf M a N (threshold M a N)) atTop (𝓝 (F 0)) ∧
    Tendsto (fun N => strictCdf M a N (threshold M a N)) atTop (𝓝 (F 0)) := by
  constructor
  · apply moving_cut_sandwich (cdf M a) F (threshold M a)
      (fun N => cdf M a N (threshold M a N)) hF hCLT (threshold_limit M a hdiag)
    · filter_upwards [] with N
      intro z hz
      exact cdf_mono M a N hz.le
    · filter_upwards [] with N
      intro z hz
      exact cdf_mono M a N hz.le
  · apply moving_cut_sandwich (cdf M a) F (threshold M a)
      (fun N => strictCdf M a N (threshold M a N)) hF hCLT (threshold_limit M a hdiag)
    · filter_upwards [] with N
      exact fun z hz => strict_lower_cut M a N z _ hz
    · filter_upwards [] with N
      exact fun z hz => strict_upper_cut M a N _ z hz

def tieMass (M : Domain) (a : Fin M.K → Bool) (N : ℕ) : ℝ :=
  ∑ x : World (sizes M N), jointMass (sizes M N) (fun i => q M (a i)) x *
    (if 2*correctCount x=N then (1:ℝ) else 0)

theorem standardized_eq_threshold (b N : ℕ) (μ σ : ℝ) (hσ : 0<σ) :
    ((b:ℝ)-μ)/σ = ((N:ℝ)/2-μ)/σ ↔ 2*b=N := by
  constructor
  · intro h
    have hm := congrArg (fun y : ℝ => y*σ) h
    simp only [div_mul_cancel₀ _ hσ.ne'] at hm
    exact_mod_cast (show (2:ℝ)*(b:ℝ)=(N:ℝ) by linarith)
  · intro h
    have hn : (2:ℝ)*(b:ℝ)=(N:ℝ) := by exact_mod_cast h
    congr 1
    linarith

theorem weak_strict_indicator_difference (r t : ℝ) :
    (if r≤t then (1:ℝ) else 0) - (if r<t then (1:ℝ) else 0) =
      if r=t then (1:ℝ) else 0 := by
  rcases lt_trichotomy r t with h | h | h
  · simp [h, h.le, h.ne]
  · subst t; simp
  · simp [not_le.mpr h, not_lt.mpr h.le, Ne.symm h.ne]

theorem tie_mass_difference (M : Domain) (a : Fin M.K → Bool) (N : ℕ) (hN : 0<N) :
    tieMass M a N = cdf M a N (threshold M a N) -
      strictCdf M a N (threshold M a N) := by
  rw [cdf_finite, strictCdf, ← Finset.sum_sub_distrib]
  unfold tieMass
  apply Finset.sum_congr rfl
  intro x _
  rw [← mul_sub, weak_strict_indicator_difference]
  simp only [show (((correctCount x:ℝ)-mean M a N)/sigma M a N = threshold M a N) ↔
    2*correctCount x=N from
      standardized_eq_threshold _ _ _ _ (sigma_pos M a N hN)]

/-- The tie atom vanishes as a CONSEQUENCE of the explicit fixed-cut CLT hypothesis. -/
theorem tie_limit_of_fixed_cut_limits (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) (F : ℝ → ℝ) (hF : ContinuousAt F 0)
    (hCLT : ∀ z, Tendsto (fun N => cdf M a N z) atTop (𝓝 (F z))) :
    Tendsto (tieMass M a) atTop (𝓝 0) := by
  have h := threshold_cdf_limits_of_fixed_cut_limits M a hdiag F hF hCLT
  have hd := h.1.sub h.2
  have he : (fun N => tieMass M a N) =ᶠ[atTop]
      (fun N => cdf M a N (threshold M a N)-strictCdf M a N (threshold M a N)) := by
    filter_upwards [eventually_ge_atTop 1] with N hN
    exact tie_mass_difference M a N (by omega)
  simpa only [sub_self] using hd.congr' he.symm

/-- The final value 1/2 requires F(0)=1/2 in addition to continuity and the unpaid CLT. -/
theorem floor_limit_diag_of_fixed_cut_limits (M : Domain) (a : Fin M.K → Bool)
    (hdiag : score M a = (1:ℝ)/2) (F : ℝ → ℝ) (hF : ContinuousAt F 0)
    (hF0 : F 0 = (1:ℝ)/2)
    (hCLT : ∀ z, Tendsto (fun N => cdf M a N z) atTop (𝓝 (F z))) :
    Tendsto (fun N => conditionalError M N a) atTop (𝓝 ((1:ℝ)/2)) := by
  simpa only [hF0] using diagonal_transfer_of_fixed_cut_limits M a hdiag F hF hCLT

/-- A scalar regression outside the independent M0 law: LLN convergence alone does
not determine a discontinuous majority limit at the diagonal. -/
def above (N : ℕ) : ℝ := (1:ℝ)/2 + 1/((N:ℝ)+1)

theorem above_limit : Tendsto above atTop (𝓝 ((1:ℝ)/2)) := by
  have hinv : Tendsto (fun N : ℕ => (1:ℝ)/((N:ℝ)+1)) atTop (𝓝 0) :=
    tendsto_const_nhds.div_atTop (tendsto_atTop_mono
      (fun N : ℕ => show (N:ℝ) ≤ (N:ℝ)+1 by linarith)
      tendsto_natCast_atTop_atTop)
  simpa only [above, add_zero] using tendsto_const_nhds.add hinv

theorem above_loss_zero (N : ℕ) : limitingLoss (above N) = 0 := by
  have hp : 0 < (1:ℝ)/((N:ℝ)+1) := by positivity
  have hg : (1:ℝ)/2 < above N := by dsimp [above]; linarith
  simp only [limitingLoss, if_neg (not_lt.mpr hg.le), if_neg (Ne.symm hg.ne)]

theorem lgn_alone_does_not_give_half :
    ¬ Tendsto (fun N => limitingLoss (above N)) atTop (𝓝 ((1:ℝ)/2)) := by
  intro h
  have hz : Tendsto (fun N => limitingLoss (above N)) atTop (𝓝 0) := by
    simpa only [above_loss_zero] using
      (tendsto_const_nhds : Tendsto (fun _ : ℕ => (0:ℝ)) atTop (𝓝 0))
  have hbad := tendsto_nhds_unique hz h
  norm_num at hbad

end Obligations046.Threshold
