# Withdrawal

<p align="center"><img src="../img/withdrawal.svg" alt="Two origins on one scale: a claims 2 to 9 and b claims 5 to 12; what they hold together runs from a floor of 5 to a ceiling of 9." width="640"></p>

A cell is two poles on a lattice it is given and never one it assumes, a set of origins whose claims say who and when, where a withdrawal names the claim it takes back rather than a value that looks like it, and an order of rest against bounds the cell does not own; six operations answer for it and there are no others: meet, what its origins and the bounds it rests on hold together in that lattice; join, one cell's ceiling widened and no other's, which lands only with a witness; encounter, how many origins met; observe, one more claim; sign, a bound narrowed so every cell resting on it reads the narrower one while no claim is touched; refine, the same cell read at another resolution.

## Run it

```ts
import { intervals } from '@lapxo/obligations/forms';
import { cell, encounter, meet, observe } from '@lapxo/obligations/views/field';

const scale = intervals(0, 20);
const held = cell('x', 0, [{ id: 'k1', origin: 'a', span: { lo: 2, hi: 9 } }, { id: 'k2', origin: 'b', span: { lo: 5, hi: 12 } }]);
const back = observe(held, { origin: 'b', span: { lo: 5, hi: 12 }, takes: 'k2' });

console.log('two origins ', encounter(scale, held).origins, JSON.stringify(meet(scale, held)));
console.log('b takes k2  ', encounter(scale, back).origins, JSON.stringify(meet(scale, back)));
console.log('claims kept ', back.seen.length);
console.log('why       a withdrawal names the claim it takes back, so the cell returns to one origin while all three claims stay on it and nothing is matched by looking like something');
```

```
two origins  2 {"lo":5,"hi":9}
b takes k2   1 {"lo":2,"hi":9}
claims kept  3
why       a withdrawal names the claim it takes back, so the cell returns to one origin while all three claims stay on it and nothing is matched by looking like something
```

## What it rests on

```mermaid
flowchart LR
  c0["cell"]
  c1["encounter"]
  c2["meet"]
  c3["observe"]
  l0(["the obligatory"])
  c0 --> l0
  c1 --> l0
  c2 --> l0
  c3 --> l0
  classDef shown fill:#2da44e,color:#ffffff,stroke:#2da44e
  class l0 shown
```

## Source

[Its source](../../examples/release/withdrawal.ts) is one of the examples of obligations, its output pinned by the lock, and it runs as it is written, against the built package, with nothing compiled for it.
