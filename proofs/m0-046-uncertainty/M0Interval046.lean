import Mathlib.Data.Real.Basic
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Positivity
import Mathlib.Tactic.Ring
import Mathlib.Tactic.FieldSimp

namespace Obligations046.Interval

def noise (p : ℝ) := 2*p*(1-p)

theorem noise_bounds (pL p pU : ℝ) (hhalf : 1/2 < pL)
    (hL : pL ≤ p) (hU : p ≤ pU) (hone : pU < 1) :
    0 < noise pU ∧ noise pU ≤ noise p ∧ noise p ≤ noise pL := by
  have h0 : 0 < pU := by linarith
  have h1 : 0 < 1-pU := sub_pos.mpr hone
  have ha : 0 < noise pU := by unfold noise; positivity
  refine ⟨ha, ?_, ?_⟩
  · have h := mul_nonneg (sub_nonneg.mpr hU) (by linarith : 0 ≤ pU+p-1)
    unfold noise
    nlinarith
  · have h := mul_nonneg (sub_nonneg.mpr hL) (by linarith : 0 ≤ p+pL-1)
    unfold noise
    nlinarith

theorem denominator_box (DL D DU aL a aU : ℝ) (hDL0 : 0 ≤ DL)
    (hDL : DL ≤ D) (hDU : D ≤ DU) (haL : 0 < aL)
    (ha : aL ≤ a) (haU : a ≤ aU) :
    1-DU/aL ≤ 1-D/a ∧ 1-D/a ≤ 1-DL/aU := by
  have ha0 : 0 < a := by linarith
  have haU0 : 0 < aU := by linarith
  have hD0 : 0 ≤ D := by linarith
  have h1 : DL/aU ≤ D/a := by
    apply (div_le_div_iff₀ haU0 ha0).mpr
    nlinarith [mul_nonneg (sub_nonneg.mpr hDL) (le_of_lt haU0),
      mul_nonneg hDL0 (sub_nonneg.mpr haU)]
  have h2 : D/a ≤ DU/aL := by
    apply (div_le_div_iff₀ ha0 haL).mpr
    nlinarith [mul_nonneg (sub_nonneg.mpr hDU) (le_of_lt ha0),
      mul_nonneg hD0 (sub_nonneg.mpr ha)]
  constructor <;> linarith

theorem ratio_box (cL c cU BL B BU : ℝ) (hcL : 0 ≤ cL)
    (hc : cL ≤ c) (hcU : c ≤ cU) (hBL : 0 < BL)
    (hB : BL ≤ B) (hBU : B ≤ BU) :
    cL^2/BU ≤ c^2/B ∧ c^2/B ≤ cU^2/BL := by
  have hB0 : 0 < B := by linarith
  have hBU0 : 0 < BU := by linarith
  have hlow : 0 ≤ c^2-cL^2 := by
    nlinarith [mul_nonneg (sub_nonneg.mpr hc) (by linarith : 0 ≤ c+cL)]
  have hhi : 0 ≤ cU^2-c^2 := by
    nlinarith [mul_nonneg (sub_nonneg.mpr hcU) (by linarith : 0 ≤ cU+c)]
  constructor
  · apply (div_le_div_iff₀ hBU0 hB0).mpr
    nlinarith [mul_nonneg hlow (le_of_lt hBU0),
      mul_nonneg (sq_nonneg cL) (sub_nonneg.mpr hBU)]
  · apply (div_le_div_iff₀ hB0 hBL).mpr
    nlinarith [mul_nonneg hhi (le_of_lt hB0),
      mul_nonneg (sq_nonneg c) (sub_nonneg.mpr hB)]

theorem pair_identity_inverse (D p c Q K : ℝ) (ha : noise p ≠ 0)
    (hQ : Q ≠ 0) (hc : c ≠ 0) (hD : D = noise p*(1-c^2*Q))
    (hK : K = 1/Q) : K = c^2/(1-D/noise p) := by
  have hb : 1-D/noise p = c^2*Q := by rw [hD]; field_simp
  rw [hb,hK]
  field_simp

-- The reciprocal has no finite upper enclosure when its denominator may approach zero.
theorem unbounded_reciprocal (c M : ℝ) (hc : 0 < c) (hM : 0 < M) :
    ∃ B : ℝ, 0 < B ∧ c^2/B > M := by
  refine ⟨c^2/(M+1), by positivity, ?_⟩
  have h : c^2/(c^2/(M+1)) = M+1 := by field_simp
  rw [h]
  linarith

-- No independence of calibration/data failures is needed for this deterministic union bound.
theorem three_budget_union (d p c : ℝ) (_hd : 0 ≤ d) (_hp : 0 ≤ p) (_hc : 0 ≤ c)
    (i j k : ℝ) (_hi : 0 ≤ i) (_hj : 0 ≤ j) (_hk : 0 ≤ k)
    (hdi : i ≤ d) (hpj : j ≤ p) (hck : k ≤ c) : i+j+k ≤ d+p+c := by linarith
theorem physical_cap_clip (L K U cap : ℝ) (hL : L ≤ K) (hU : K ≤ U)
    (hK : 1 ≤ K) (hcap : K ≤ cap) : max 1 L ≤ K ∧ K ≤ min U cap :=
  ⟨max_le hK hL, le_min hU hcap⟩
end Obligations046.Interval
