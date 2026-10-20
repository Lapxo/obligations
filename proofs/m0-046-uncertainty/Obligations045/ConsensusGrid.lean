import Std
set_option maxRecDepth 10000
set_option maxHeartbeats 8000000
namespace Obligations045
-- Finite closed-form calculation only. This file does not assert a limit theorem.
def binom : Nat → Nat → Nat
  | 0, 0 => 1
  | 0, _ + 1 => 0
  | _ + 1, 0 => 1
  | n + 1, k + 1 => binom n k + binom n (k + 1)
def configs : Nat → List (List Bool)
  | 0 => [[]]
  | k + 1 => (configs k).flatMap (fun xs => [false :: xs, true :: xs])
def ones (xs : List Bool) : Nat := (xs.filter id).length
-- p=P/20, c=C/20. Below/equal/above 1/2 encoded as 2/1/0.
def loss2 (K P C m : Nat) : Nat :=
  let lhs := 2 * (20 * C * m + (20-C) * P * K)
  let rhs := 400 * K
  if lhs < rhs then 2 else if lhs == rhs then 1 else 0
def grouped (K P C : Nat) : Nat :=
  ((List.range (K+1)).map (fun m =>
    binom K m * P^m * (20-P)^(K-m) * loss2 K P C m)).sum
def enumerated (K P C : Nat) : Nat :=
  ((configs K).map (fun xs =>
    P^(ones xs) * (20-P)^(K-ones xs) * loss2 K P C (ones xs))).sum
def grid : List (Nat × Nat × Nat) :=
  ([1,2,3,4] : List Nat).flatMap (fun K =>
    (List.range 9).flatMap (fun i =>
      (List.range 20).map (fun j => (K,11+i,1+j))))
theorem grid_has_720_cases : grid.length = 720 := by decide
theorem closed_form_matches_full_configurations :
    ∀ x ∈ grid, grouped x.1 x.2.1 x.2.2 = enumerated x.1 x.2.1 x.2.2 := by decide
theorem grid_probability_range :
    ∀ x ∈ grid, grouped x.1 x.2.1 x.2.2 ≤ 2*20^x.1 := by decide
-- p=3/4, c=1/2: two distinct K have the same 1/64 floor.
theorem inverse_alias :
    grouped 3 15 10 * (2*20^5) = grouped 5 15 10 * (2*20^3) := by decide
-- For p=3/4,c=9/10 and counts summing to N, compare score with 17*N/36.
def score (counts : List Nat) (zs : List Bool) : Nat :=
  ((counts.zip zs).map (fun x => if x.2 then x.1 else 0)).sum
def floorNumerator (counts : List Nat) : Nat :=
  ((configs counts.length).map (fun zs =>
    let lhs := 36 * score counts zs
    let rhs := 17 * counts.sum
    let factor := if lhs < rhs then 2 else if lhs == rhs then 1 else 0
    3^(ones zs) * factor)).sum
-- Denominator is 2*4^3=128 in each three-lineage case.
theorem same_effective_participation_different_floor :
    (1*1+4*4+4*4 : Nat) = 2*2+2*2+5*5 ∧
    floorNumerator [1,4,4] = 20 ∧ floorNumerator [2,2,5] = 32 := by decide
-- WF population N=5, initial counts [3,1,1]; all 21 descendant count states.
def wfNumerator : Nat :=
  ((List.range 6).map (fun a =>
    ((List.range (6-a)).map (fun b =>
      binom 5 a * binom (5-a) b * 3^a *
        floorNumerator [a,b,5-a-b])).sum)).sum
theorem wf_transition_normalized :
    ((List.range 6).map (fun a =>
      ((List.range (6-a)).map (fun b =>
        binom 5 a * binom (5-a) b * 3^a)).sum)).sum = 5^5 := by decide
theorem wf_floor_decreases_in_expectation :
    floorNumerator [3,1,1] = 32 ∧ wfNumerator = 92440 ∧
    wfNumerator < floorNumerator [3,1,1] * 5^5 := by decide
end Obligations045
#print axioms Obligations045.grid_has_720_cases
#print axioms Obligations045.closed_form_matches_full_configurations
#print axioms Obligations045.grid_probability_range
#print axioms Obligations045.inverse_alias

#print axioms Obligations045.same_effective_participation_different_floor
#print axioms Obligations045.wf_transition_normalized
#print axioms Obligations045.wf_floor_decreases_in_expectation
