import Obligations.Cell
import Lean.Data.Json

/- A finite comparison fixture for the existing JavaScript interval operation.
   It is not an admission reader, wire adapter, or replacement for that operation. -/
open Obligations Lean

private def endpoints : List Int := [-1, 0, 1, 2]

private def cells : List (Cell Int) :=
  endpoints.flatMap fun lo => endpoints.map fun hi => ⟨lo, hi⟩

private def row (a b : Cell Int) : Json :=
  let m := Cell.meet a b
  Json.arr #[toJson a.lo, toJson a.hi, toJson b.lo, toJson b.hi,
    toJson m.lo, toJson m.hi, toJson (decide (Cell.apiLeq a b)),
    toJson (decide (m.hi < m.lo))]

def main : IO Unit :=
  IO.println (Json.arr (cells.flatMap fun a => cells.map (row a)).toArray).compress
