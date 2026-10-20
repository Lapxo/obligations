import M0Bridge

open scoped BigOperators
open MeasureTheory ProbabilityTheory
noncomputable section
open Classical
namespace Obligations046.M1Bridge
open Obligations046.Bridge

/-- Four EXCLUSIVE outcomes of the sequential ancestor-first generator.
Fresh success/failure are distinct elementary outcomes, not a count-law premise. -/
def branchMass (p c1 c2 : ℝ) (e : Fin 4) : ℝ :=
  if e = 0 then c1 else if e = 1 then (1-c1)*c2
  else if e = 2 then (1-c1)*(1-c2)*p else (1-c1)*(1-c2)*(1-p)
def branchBit (A B : Bool) (e : Fin 4) : Bool :=
  if e = 0 then A else if e = 1 then B else decide (e = 2)
def success (p c1 c2 : ℝ) (A B : Bool) : ℝ :=
  c1*(if A then 1 else 0)+(1-c1)*c2*(if B then 1 else 0)+(1-c1)*(1-c2)*p

theorem branch_normalized (p c1 c2 : ℝ) : ∑ e : Fin 4, branchMass p c1 c2 e = 1 := by
  simp [Fin.sum_univ_succ, branchMass]
  ring

theorem branch_nonneg (p c1 c2 : ℝ) (hp : 0 ≤ p) (hp1 : p ≤ 1)
    (hc1 : 0 ≤ c1) (hc1' : c1 ≤ 1) (hc2 : 0 ≤ c2) (hc2' : c2 ≤ 1)
    (e : Fin 4) : 0 ≤ branchMass p c1 c2 e := by
  have h1 : 0 ≤ 1-c1 := sub_nonneg.mpr hc1'
  have h2 : 0 ≤ 1-c2 := sub_nonneg.mpr hc2'
  have h3 : 0 ≤ 1-p := sub_nonneg.mpr hp1
  unfold branchMass
  split_ifs <;> positivity

theorem branch_bit_fiber (p c1 c2 : ℝ) (A B z : Bool) :
    (∑ e : Fin 4, if branchBit A B e = z then branchMass p c1 c2 e else 0) =
      if z then success p c1 c2 A B else 1-success p c1 c2 A B := by
  cases A <;> cases B <;> cases z <;>
    simp [Fin.sum_univ_succ, branchBit, branchMass, success] <;> ring

/-- Bijection between raw named binary member outcomes and subsets, independent of probabilities. -/
def subsetBits (n : ℕ) : Finset (Fin n) ≃ (Fin n → Bool) where
  toFun s j := decide (j ∈ s)
  invFun z := Finset.univ.filter (fun j => z j)
  left_inv s := by ext j; simp
  right_inv z := by funext j; simp

def memberSubset {n : ℕ} (A B : Bool) (x : Fin n → Fin 4) : Finset (Fin n) :=
  Finset.univ.filter (fun j => branchBit A B (x j))

theorem selector_to_member (p c1 c2 : ℝ) (A B : Bool) (n : ℕ)
    (f : Finset (Fin n) → ℝ) :
    (∑ x : Fin n → Fin 4, (∏ j, branchMass p c1 c2 (x j))*f (memberSubset A B x)) =
      ∑ s : Finset (Fin n), mass (success p c1 c2 A B) s*f s := by
  have h := product_pushforward (fun (_j : Fin n) e => branchMass p c1 c2 e)
    (fun _ e => branchBit A B e) (fun z => f ((subsetBits n).symm z))
  simp only [branch_bit_fiber] at h
  change _ = _ at h
  calc
    _ = ∑ z : Fin n → Bool,
        (∏ j, if z j then success p c1 c2 A B else 1-success p c1 c2 A B)*
          f ((subsetBits n).symm z) := by simpa [memberSubset, subsetBits] using h
    _ = ∑ s : Finset (Fin n), mass (success p c1 c2 A B) s*f s := by
      rw [← (subsetBits n).sum_comp]
      apply Finset.sum_congr rfl
      intro s _
      simp only [Equiv.symm_apply_apply]
      rw [mass_eq_individual_product]
      simp [subsetBits]

/-- Push forward literal independent selectors to every joint lineage COUNT event. -/
theorem selector_count_fiber (p c1 c2 : ℝ) (A B : Bool) (n : ℕ) (k : Fin (n+1)) :
    (∑ x : Fin n → Fin 4,
      if count (memberSubset A B x) = k then ∏ j, branchMass p c1 c2 (x j) else 0) =
      binMass (success p c1 c2 A B) n k := by
  have h := selector_to_member p c1 c2 A B n (fun s => if count s = k then 1 else 0)
  simpa only [mul_ite, mul_one, mul_zero, count_fiber_mass] using h

/-- p and weights/quota domain are exactly the existing M0 domain; c is c1 here.
The additional conditional child rate and named parent map are new model parameters. -/
structure Model where
  base : Obligations045.M0.Domain
  ancestors : ℕ
  parent : Fin base.K → Fin ancestors
  c2 : ℝ
  c2_nonneg : 0 ≤ c2
  c2_lt_one : c2 < 1

abbrev sizes (M : Model) (N : ℕ) (i : Fin M.base.K) :=
  Obligations045.M0.allocation M.base.w N i
abbrev Ancestors (M : Model) := Fin M.ancestors → Bool
abbrev Leaves (M : Model) := Fin M.base.K → Bool
abbrev Raw (M : Model) (N : ℕ) := ∀ i : Fin M.base.K, Fin (sizes M N i) → Fin 4

def q (M : Model) (A : Ancestors M) (B : Leaves M) (i : Fin M.base.K) : ℝ :=
  success M.base.p M.base.c M.c2 (A (M.parent i)) (B i)
def rawMass (M : Model) (N : ℕ) (x : Raw M N) : ℝ :=
  ∏ i, ∏ j, branchMass M.base.p M.base.c M.c2 (x i j)
def counts (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M) (x : Raw M N) :=
  fun i => count (memberSubset (A (M.parent i)) (B i) (x i))

theorem rawMass_normalized (M : Model) (N : ℕ) : ∑ x : Raw M N, rawMass M N x = 1 := by
  calc
    _ = ∏ i : Fin M.base.K, ∑ x : Fin (sizes M N i) → Fin 4,
        ∏ j, branchMass M.base.p M.base.c M.c2 (x j) :=
      (Fintype.prod_sum (fun i (x : Fin (sizes M N i) → Fin 4) =>
        ∏ j, branchMass M.base.p M.base.c M.c2 (x j))).symm
    _ = 1 := by
      apply Finset.prod_eq_one
      intro i _
      rw [← Fintype.prod_sum (fun (_j : Fin (sizes M N i)) e => branchMass M.base.p M.base.c M.c2 e)]
      simp only [branch_normalized, Finset.prod_const_one]

theorem rawMass_nonneg (M : Model) (N : ℕ) (x : Raw M N) : 0 ≤ rawMass M N x := by
  apply Finset.prod_nonneg
  intro i _
  apply Finset.prod_nonneg
  intro j _
  exact branch_nonneg _ _ _ (by linarith [M.base.p_half]) M.base.p_lt_one.le
    M.base.c_nonneg M.base.c_lt_one.le M.c2_nonneg M.c2_lt_one.le _

/-- Full finite expectation bridge: no binomial count premise, limit premise or CLT. -/
theorem generator_to_binomial (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M)
    (f : (∀ i : Fin M.base.K, Fin (sizes M N i+1)) → ℝ) :
    (∑ x : Raw M N, rawMass M N x*f (counts M N A B x)) =
      ∑ k : ∀ i : Fin M.base.K, Fin (sizes M N i+1),
        (∏ i, binMass (q M A B i) (sizes M N i) (k i))*f k := by
  have h := product_pushforward
    (fun i (x : Fin (sizes M N i) → Fin 4) => ∏ j, branchMass M.base.p M.base.c M.c2 (x j))
    (fun i x => count (memberSubset (A (M.parent i)) (B i) x)) f
  simpa only [selector_count_fiber, q, rawMass, counts] using h

def rawError (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M) : ℝ :=
  ∑ x : Raw M N, rawMass M N x *
    Obligations045.M0.fairLoss (∑ i, (counts M N A B x i : ℕ)) N

def binomialError (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M) : ℝ :=
  ∑ k : ∀ i : Fin M.base.K, Fin (sizes M N i+1),
    (∏ i, binMass (q M A B i) (sizes M N i) (k i))*
      Obligations045.M0.fairLoss (∑ i, (k i : ℕ)) N

theorem conditional_error_bridge (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M) :
    rawError M N A B = binomialError M N A B :=
  by
    simpa only [rawError, binomialError] using generator_to_binomial M N A B
      (fun k => Obligations045.M0.fairLoss (∑ i, (k i : ℕ)) N)

/-- Primitive jointly independent ancestor-selector, child-selector and fresh-vote bits.
Unused primitive draws are retained in the world and summed out, not conditioned away. -/
abbrev Primitive := Bool × Bool × Bool
def bernMass (r : ℝ) (b : Bool) : ℝ := if b then r else 1-r
def primitiveMass (p c1 c2 : ℝ) (t : Primitive) : ℝ :=
  bernMass c1 t.1 * bernMass c2 t.2.1 * bernMass p t.2.2
def primitiveBranch (t : Primitive) : Fin 4 :=
  if t.1 then 0 else if t.2.1 then 1 else if t.2.2 then 2 else 3

theorem primitive_branch_fiber (p c1 c2 : ℝ) (e : Fin 4) :
    (∑ t : Primitive, if primitiveBranch t = e then primitiveMass p c1 c2 t else 0) =
      branchMass p c1 c2 e := by
  fin_cases e <;>
    simp [Fintype.sum_prod_type, Fintype.sum_bool, primitiveBranch, primitiveMass, bernMass, branchMass] <;> ring

theorem primitive_normalized (p c1 c2 : ℝ) : ∑ t : Primitive, primitiveMass p c1 c2 t = 1 := by
  simp [Fintype.sum_prod_type, Fintype.sum_bool, primitiveMass, bernMass]
  ring

theorem primitive_output_is_sequential (A B : Bool) (t : Primitive) :
    branchBit A B (primitiveBranch t) =
      if t.1 then A else if t.2.1 then B else t.2.2 := by
  rcases t with ⟨u,v,f⟩
  cases u <;> cases v <;> cases f <;> rfl

theorem primitive_member_pushforward (p c1 c2 : ℝ) (n : ℕ)
    (f : (Fin n → Fin 4) → ℝ) :
    (∑ t : Fin n → Primitive, (∏ j, primitiveMass p c1 c2 (t j))*
      f (fun j => primitiveBranch (t j))) =
      ∑ x : Fin n → Fin 4, (∏ j, branchMass p c1 c2 (x j))*f x := by
  simpa only [primitive_branch_fiber] using product_pushforward
    (fun (_j : Fin n) t => primitiveMass p c1 c2 t) (fun _ => primitiveBranch) f

theorem primitive_count_fiber (p c1 c2 : ℝ) (A B : Bool) (n : ℕ) (k : Fin (n+1)) :
    (∑ t : Fin n → Primitive,
      if count (memberSubset A B (fun j => primitiveBranch (t j))) = k
      then ∏ j, primitiveMass p c1 c2 (t j) else 0) =
      binMass (success p c1 c2 A B) n k := by
  have h := primitive_member_pushforward p c1 c2 n
    (fun x => if count (memberSubset A B x) = k then 1 else 0)
  simpa only [mul_ite, mul_one, mul_zero, selector_count_fiber] using h

abbrev PrimitiveWorld (M : Model) (N : ℕ) :=
  ∀ i : Fin M.base.K, Fin (sizes M N i) → Primitive
def primitiveJointMass (M : Model) (N : ℕ) (x : PrimitiveWorld M N) : ℝ :=
  ∏ i, ∏ j, primitiveMass M.base.p M.base.c M.c2 (x i j)
def primitiveCounts (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M)
    (x : PrimitiveWorld M N) :=
  fun i => count (memberSubset (A (M.parent i)) (B i) (fun j => primitiveBranch (x i j)))

/-- The main bridge begins with the THREE INDEPENDENT PRIMITIVE BITS per named member,
not assumed Bernoulli output bits or an assumed binomial count distribution. -/
theorem primitive_generator_to_binomial (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M)
    (f : (∀ i : Fin M.base.K, Fin (sizes M N i+1)) → ℝ) :
    (∑ x : PrimitiveWorld M N, primitiveJointMass M N x*f (primitiveCounts M N A B x)) =
      ∑ k : ∀ i : Fin M.base.K, Fin (sizes M N i+1),
        (∏ i, binMass (q M A B i) (sizes M N i) (k i))*f k := by
  have h := product_pushforward
    (fun i (x : Fin (sizes M N i) → Primitive) => ∏ j, primitiveMass M.base.p M.base.c M.c2 (x j))
    (fun i x => count (memberSubset (A (M.parent i)) (B i) (fun j => primitiveBranch (x j)))) f
  simpa only [primitive_count_fiber, primitiveJointMass, primitiveCounts, q] using h

theorem bern_nonneg (r : ℝ) (hr : 0 ≤ r) (hr1 : r ≤ 1) (b : Bool) :
    0 ≤ bernMass r b := by
  cases b <;> simp only [bernMass, Bool.false_eq_true, ite_false, ite_true]
  · exact sub_nonneg.mpr hr1
  · exact hr

theorem primitive_joint_nonneg (M : Model) (N : ℕ) (x : PrimitiveWorld M N) :
    0 ≤ primitiveJointMass M N x := by
  apply Finset.prod_nonneg
  intro i _
  apply Finset.prod_nonneg
  intro j _
  exact mul_nonneg
    (mul_nonneg (bern_nonneg _ M.base.c_nonneg M.base.c_lt_one.le _)
      (bern_nonneg _ M.c2_nonneg M.c2_lt_one.le _))
    (bern_nonneg _ (by linarith [M.base.p_half]) M.base.p_lt_one.le _)

theorem primitive_joint_normalized (M : Model) (N : ℕ) :
    ∑ x : PrimitiveWorld M N, primitiveJointMass M N x = 1 := by
  calc
    _ = ∏ i : Fin M.base.K, ∑ x : Fin (sizes M N i) → Primitive,
        ∏ j, primitiveMass M.base.p M.base.c M.c2 (x j) :=
      (Fintype.prod_sum (fun i (x : Fin (sizes M N i) → Primitive) =>
        ∏ j, primitiveMass M.base.p M.base.c M.c2 (x j))).symm
    _ = 1 := by
      apply Finset.prod_eq_one
      intro i _
      rw [← Fintype.prod_sum (fun (_j : Fin (sizes M N i)) t => primitiveMass M.base.p M.base.c M.c2 t)]
      simp only [primitive_normalized, Finset.prod_const_one]

instance primitiveMeasurableSpace (M : Model) (N : ℕ) :
    MeasurableSpace (PrimitiveWorld M N) := ⊤
instance primitiveDiscreteMeasurable (M : Model) (N : ℕ) :
    DiscreteMeasurableSpace (PrimitiveWorld M N) := ⟨fun _ => trivial⟩

/-- Genuine finite PMF on independent primitive bits; no binomial premise. -/
def primitiveLaw (M : Model) (N : ℕ) : PMF (PrimitiveWorld M N) :=
  PMF.ofFintype (fun x => ENNReal.ofReal (primitiveJointMass M N x)) (by
    rw [← ENNReal.ofReal_sum_of_nonneg]
    · simp [primitive_joint_normalized]
    · intro x _
      exact primitive_joint_nonneg M N x)

theorem primitive_law_count_expectation (M : Model) (N : ℕ)
    (A : Ancestors M) (B : Leaves M)
    (f : (∀ i : Fin M.base.K, Fin (sizes M N i+1)) → ℝ) :
    (∫ x, f (primitiveCounts M N A B x) ∂(primitiveLaw M N).toMeasure) =
      ∑ k : ∀ i : Fin M.base.K, Fin (sizes M N i+1),
        (∏ i, binMass (q M A B i) (sizes M N i) (k i))*f k := by
  rw [PMF.integral_eq_sum]
  calc
    _ = ∑ x : PrimitiveWorld M N,
        primitiveJointMass M N x*f (primitiveCounts M N A B x) := by
      apply Finset.sum_congr rfl
      intro x _
      simp only [primitiveLaw, PMF.ofFintype_apply, smul_eq_mul]
      rw [ENNReal.toReal_ofReal (primitive_joint_nonneg M N x)]
    _ = _ := primitive_generator_to_binomial M N A B f

theorem primitive_law_count_probability (M : Model) (N : ℕ)
    (A : Ancestors M) (B : Leaves M) (k : ∀ i : Fin M.base.K, Fin (sizes M N i+1)) :
    (∫ x, if primitiveCounts M N A B x = k then (1:ℝ) else 0
      ∂(primitiveLaw M N).toMeasure) = ∏ i, binMass (q M A B i) (sizes M N i) (k i) := by
  simpa using primitive_law_count_expectation M N A B (fun z => if z = k then (1:ℝ) else 0)

theorem primitive_law_error_bridge (M : Model) (N : ℕ) (A : Ancestors M) (B : Leaves M) :
    (∫ x, Obligations045.M0.fairLoss (∑ i, (primitiveCounts M N A B x i : ℕ)) N
      ∂(primitiveLaw M N).toMeasure) = binomialError M N A B :=
  by
    simpa only [binomialError] using primitive_law_count_expectation M N A B
      (fun k => Obligations045.M0.fairLoss (∑ i, (k i : ℕ)) N)

def latentMass (M : Model) (A : Ancestors M) (B : Leaves M) : ℝ :=
  (∏ g, bernMass M.base.p (A g))*(∏ i, bernMass M.base.p (B i))

theorem latent_normalized (M : Model) :
    ∑ A : Ancestors M, ∑ B : Leaves M, latentMass M A B = 1 := by
  have ha : (∑ A : Ancestors M, ∏ g, bernMass M.base.p (A g)) = 1 := by
    rw [← Fintype.prod_sum]
    simp [Fintype.sum_bool, bernMass]
  have hb : (∑ B : Leaves M, ∏ i, bernMass M.base.p (B i)) = 1 := by
    rw [← Fintype.prod_sum]
    simp [Fintype.sum_bool, bernMass]
  simp only [latentMass, ← Finset.mul_sum, hb, mul_one, ha]

theorem mixture_error_bridge (M : Model) (N : ℕ) :
    (∑ A : Ancestors M, ∑ B : Leaves M, latentMass M A B *
      ∫ x, Obligations045.M0.fairLoss (∑ i, (primitiveCounts M N A B x i : ℕ)) N
        ∂(primitiveLaw M N).toMeasure) =
      ∑ A : Ancestors M, ∑ B : Leaves M, latentMass M A B * binomialError M N A B := by
  simp only [primitive_law_error_bridge]

/-- Pure algebraic reduction only; no new limit or uncertainty certificate. -/
theorem zero_ancestor_reduction (M : Model) (A : Ancestors M) (B : Leaves M)
    (hc : M.base.c = 0) (i : Fin M.base.K) :
    q M A B i = (1-M.c2)*M.base.p + if B i then M.c2 else 0 := by
  cases h : B i <;> simp [q, success, hc, h, add_comm]

theorem latent_nonneg (M : Model) (A : Ancestors M) (B : Leaves M) :
    0 ≤ latentMass M A B := by
  apply mul_nonneg <;> apply Finset.prod_nonneg <;> intro i _ <;>
    exact bern_nonneg _ (by linarith [M.base.p_half]) M.base.p_lt_one.le _

abbrev FullWorld (M : Model) (N : ℕ) := (Ancestors M × Leaves M) × PrimitiveWorld M N
def fullMass (M : Model) (N : ℕ) (x : FullWorld M N) : ℝ :=
  latentMass M x.1.1 x.1.2 * primitiveJointMass M N x.2

theorem fullMass_nonneg (M : Model) (N : ℕ) (x : FullWorld M N) : 0 ≤ fullMass M N x :=
  mul_nonneg (latent_nonneg M _ _) (primitive_joint_nonneg M N _)

theorem fullMass_normalized (M : Model) (N : ℕ) : ∑ x : FullWorld M N, fullMass M N x = 1 := by
  simp only [Fintype.sum_prod_type, fullMass, ← Finset.mul_sum,
    primitive_joint_normalized, mul_one, latent_normalized]

instance fullMeasurableSpace (M : Model) (N : ℕ) : MeasurableSpace (FullWorld M N) := ⊤
instance fullDiscreteMeasurable (M : Model) (N : ℕ) :
    DiscreteMeasurableSpace (FullWorld M N) := ⟨fun _ => trivial⟩

/-- The COMPLETE finite generative law includes jointly independent latent bits
and all independent selector/fresh primitive draws. -/
def fullLaw (M : Model) (N : ℕ) : PMF (FullWorld M N) :=
  PMF.ofFintype (fun x => ENNReal.ofReal (fullMass M N x)) (by
    rw [← ENNReal.ofReal_sum_of_nonneg]
    · simp [fullMass_normalized]
    · intro x _
      exact fullMass_nonneg M N x)

def implementationError (M : Model) (N : ℕ) : ℝ :=
  ∑ A : Ancestors M, ∑ B : Leaves M, latentMass M A B * binomialError M N A B

/-- Complete generator–implementation bridge for every finiteN. No count distribution,
error convergence, causal identification or oracle-free calibration is assumed. -/
theorem full_generator_error_bridge (M : Model) (N : ℕ) :
    (∫ x, Obligations045.M0.fairLoss
      (∑ i, (primitiveCounts M N x.1.1 x.1.2 x.2 i : ℕ)) N ∂(fullLaw M N).toMeasure) =
      implementationError M N := by
  rw [PMF.integral_eq_sum]
  have hp (x : FullWorld M N) : ((fullLaw M N) x).toReal = fullMass M N x := by
    simp only [fullLaw, PMF.ofFintype_apply]
    exact ENNReal.toReal_ofReal (fullMass_nonneg M N x)
  simp_rw [smul_eq_mul, hp]
  simp only [Fintype.sum_prod_type, implementationError, fullMass, mul_assoc]
  apply Finset.sum_congr rfl
  intro A _
  apply Finset.sum_congr rfl
  intro B _
  rw [← Finset.mul_sum]
  congr 1
  simpa only [binomialError] using primitive_generator_to_binomial M N A B
    (fun k => Obligations045.M0.fairLoss (∑ i, (k i : ℕ)) N)

end Obligations046.M1Bridge
