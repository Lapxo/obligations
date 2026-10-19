import Mathlib.Order.Interval.Set.Basic

/-!
The endpoint operation of `src/lattice/forms.ts`, not a replacement algebra.
`apiLeq` preserves its empty-interval convention. It is a preorder on raw
endpoint pairs, not an antisymmetric order. The observable semilattice below
identifies exactly equal interval meanings; no TypeScript representation changes.

The numerical bridge is restricted to values with a total order (in the executable
vector: finite integers). This does not assert a LinearOrder on IEEE-754 NaN.
-/
namespace Obligations

structure Cell (α : Type*) where
  lo : α
  hi : α
  deriving DecidableEq

namespace Cell
variable {α : Type*} [LinearOrder α]

def meet (a b : Cell α) : Cell α := ⟨max a.lo b.lo, min a.hi b.hi⟩

theorem meet_comm (a b : Cell α) : meet a b = meet b a := by
  cases a; cases b
  simp [meet, max_comm, min_comm]

theorem meet_assoc (a b c : Cell α) : meet (meet a b) c = meet a (meet b c) := by
  cases a; cases b; cases c
  simp [meet, max_assoc, min_assoc]

theorem meet_idem (a : Cell α) : meet a a = a := by
  cases a
  simp [meet]

instance : Min (Cell α) := ⟨meet⟩

/-- Its induced endpoint order is not the API's empty-interval preorder. -/
def endpointSemilattice : SemilatticeInf (Cell α) :=
  SemilatticeInf.mk' meet_comm meet_assoc meet_idem

/-- Literal branch order of the existing interval `leq`. -/
def apiLeq (a b : Cell α) : Prop :=
  if a.hi < a.lo then True
  else if b.hi < b.lo then False
  else b.lo ≤ a.lo ∧ a.hi ≤ b.hi

instance (a b : Cell α) : Decidable (apiLeq a b) := by
  unfold apiLeq
  infer_instance

def meaning (a : Cell α) : Set α := Set.Icc a.lo a.hi

theorem meaning_meet (a b : Cell α) :
    meaning (meet a b) = meaning a ∩ meaning b := by
  apply Set.ext
  intro x
  simp only [meaning, meet, Set.mem_Icc, Set.mem_inter_iff]
  constructor
  · intro h
    exact ⟨⟨le_trans (le_max_left _ _) h.1, le_trans h.2 (min_le_left _ _)⟩,
      ⟨le_trans (le_max_right _ _) h.1, le_trans h.2 (min_le_right _ _)⟩⟩
  · intro h
    exact ⟨max_le h.1.1 h.2.1, le_min h.1.2 h.2.2⟩

theorem apiLeq_iff_subset (a b : Cell α) :
    apiLeq a b ↔ meaning a ⊆ meaning b := by
  by_cases ha : a.hi < a.lo
  · simp [apiLeq, ha, meaning, Set.Icc_eq_empty_of_lt ha]
  · have hab : a.lo ≤ a.hi := le_of_not_gt ha
    by_cases hb : b.hi < b.lo
    · simp only [apiLeq, ha, hb, if_false, if_true]
      constructor
      · intro h; exact False.elim h
      · intro h
        have hx := h (show a.lo ∈ meaning a from ⟨le_rfl, hab⟩)
        exact (not_le_of_gt hb) (le_trans hx.1 hx.2)
    · simpa [apiLeq, ha, hb, meaning] using
        (Set.Icc_subset_Icc_iff hab).symm

theorem meet_narrows_left (a b : Cell α) : apiLeq (meet a b) a := by
  rw [apiLeq_iff_subset, meaning_meet]
  exact Set.inter_subset_left

theorem meet_narrows_right (a b : Cell α) : apiLeq (meet a b) b := by
  rw [apiLeq_iff_subset, meaning_meet]
  exact Set.inter_subset_right

theorem apiLeq_refl (a : Cell α) : apiLeq a a :=
  (apiLeq_iff_subset a a).mpr (Set.Subset.refl _)

theorem apiLeq_trans {a b c : Cell α} (hab : apiLeq a b) (hbc : apiLeq b c) :
    apiLeq a c :=
  (apiLeq_iff_subset a c).mpr
    (Set.Subset.trans ((apiLeq_iff_subset a b).mp hab) ((apiLeq_iff_subset b c).mp hbc))

theorem mutually_narrows_iff (a b : Cell α) :
    (apiLeq a b ∧ apiLeq b a) ↔ meaning a = meaning b := by
  rw [apiLeq_iff_subset, apiLeq_iff_subset]
  exact ⟨fun h => Set.Subset.antisymm h.1 h.2, fun h => ⟨h.subset, h.symm.subset⟩⟩

/-- Observable interval classes, represented by their meaning, not new stored cells. -/
def SemanticCell (α : Type*) [LinearOrder α] :=
  {s : Set α // ∃ c : Cell α, meaning c = s}

instance : Min (SemanticCell α) where
  min a b := ⟨a.val ∩ b.val, by
    rcases a.property with ⟨ca, hca⟩
    rcases b.property with ⟨cb, hcb⟩
    exact ⟨meet ca cb, by rw [meaning_meet, hca, hcb]⟩⟩

instance : SemilatticeInf (SemanticCell α) :=
  Function.Injective.semilatticeInf Subtype.val Subtype.val_injective (fun _ _ => rfl)

def observe (a : Cell α) : SemanticCell α := ⟨meaning a, a, rfl⟩

theorem observe_meet (a b : Cell α) :
    observe (meet a b) = observe a ⊓ observe b :=
  Subtype.ext (meaning_meet a b)

theorem observe_order (a b : Cell α) : observe a ≤ observe b ↔ apiLeq a b :=
  (apiLeq_iff_subset a b).symm

/-- Distinct raw empty intervals are equivalent in the published API. -/
theorem crossed_pairs_not_antisymmetric :
    let a : Cell Int := ⟨5, 3⟩
    let b : Cell Int := ⟨8, 6⟩
    apiLeq a b ∧ apiLeq b a ∧ a ≠ b := by decide

/-- A duplicate accumulated restriction does not change a merge result. -/
theorem duplicate_delivery (a b : Cell α) : meet (meet a b) b = meet a b := by
  rw [meet_assoc, meet_idem]

/-- Replay order of three accumulated restrictions does not change the result. -/
theorem reordered_delivery (a b c : Cell α) :
    meet (meet a b) c = meet (meet c a) b := by
  rw [meet_assoc, meet_comm b c, ← meet_assoc, meet_comm a c]

def fold (seed : Cell α) (claims : List (Cell α)) : Cell α :=
  claims.foldl meet seed

/-- Any finite replay permutation agrees, under the same starting restriction. -/
theorem permutation_invariant {xs ys : List (Cell α)} (h : xs.Perm ys)
    (seed : Cell α) : fold seed xs = fold seed ys := by
  induction h generalizing seed with
  | nil => rfl
  | cons a h ih => exact ih (meet seed a)
  | swap a b xs =>
    have hc : meet (meet seed b) a = meet (meet seed a) b := by
      rw [meet_assoc, meet_comm b a, ← meet_assoc]
    simp only [fold, List.foldl_cons, hc]
  | trans h₁ h₂ ih₁ ih₂ => exact (ih₁ seed).trans (ih₂ seed)

theorem duplicate_in_replay (seed a : Cell α) (xs : List (Cell α)) :
    fold seed (a :: a :: xs) = fold seed (a :: xs) := by
  simp only [fold, List.foldl_cons, duplicate_delivery]

end Cell
end Obligations
