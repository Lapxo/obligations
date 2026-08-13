# Working on this

## The whole structure

```
src/
  index.ts       the public surface — the only file a consumer imports
  types.ts       the shared shapes; everything imports from here, nothing back
  errors.ts      UnitError and its codes
  order.ts       building a scale:  chain(), order()
  unit.ts        the primitive:     compose, state, entails, either, missing
  packed.ts      the fast form:     packer, register, closure
  price.ts       dropTo, defect, price, localise
  provenance.ts  weakest
  reach.ts       reach, effective
test/            runs vectors/
vectors/         JSON that defines conforming behaviour
examples/        runnable, by domain, never shipped
```

One file per concept, one level deep. No layers, no folders inside `src/`, no
inversion of anything. If a file grows past what one concept needs, that is the
signal to split it — not to add a directory.

Nothing in `src/` does I/O. No clock, no filesystem, no network, no module
state. Every function takes what it needs and returns a value, which is why the
same code runs in Node, a browser, a worker or a test.

## Adding an operation

1. **Write it** in the file that owns the concept, taking a `Scale` and
   `Unit`s. Use `scale.higher`, `scale.lower`, `scale.leq` — never `<` on a
   `Level`. A `Level` is an index into a list of names, not a height, and
   comparing two of them numerically is wrong the moment the scale is not a
   plain ladder.

2. **Add a vector file** under `vectors/`, with a `coverage` block saying how
   many cases and by what criterion. The runner refuses a file without one.

3. **Run it** from `test/vectors.test.ts`.

Step 2 is not optional. The vectors are what keeps two implementations of this
from drifting, and an operation with no vector is one nobody can port.

## Where a thing belongs

Ask what the operation needs to know.

| it needs                                        | it goes in  |
| ----------------------------------------------- | ----------- |
| which level something is                        | `unit.ts`   |
| only whether each step is demanded or permitted | `packed.ts` |
| what a level is worth                           | `price.ts`  |

The fast form works because asking each **step** two yes/no questions gives
answers that combine independently — demanded by OR, permitted by AND. If your
operation fits that shape it is cheap; if it needs the level itself, it is not.

## Errors

Add a code to `UnitErrorCode` rather than throwing a bare `Error`. Callers
switch on the code and show the message.

Three of the existing codes are there because the alternative was being wrong
in silence:

- `NOT_FINITE` — every comparison with `NaN` is false, including the ones meant
  to reject it, so it is checked before anything compares.
- `UNKNOWN_ROW` — reading past a typed array gives `undefined`, and
  `x & undefined` is `0`, which would have come back as "permits nothing".
- `DUPLICATE_LEVEL` — a name is how a caller reaches a level, so two sharing
  one leaves the other unreachable.

## Build

```
tsconfig.json           →  dist/
tsconfig.examples.json  →  dist-examples/, never published
```

One build, one output, same as the other libraries here.

One build, one output, same as the other libraries here.

## What ships

`files` names it positively: `dist/**/*` and `src/**/*`. Everything under
`src/` is source, so there is no pattern to keep in agreement with anything.
Tests, examples, vectors and build output live outside it and stay in the repo.

`src` ships because `declarationMap` is on, so go-to-definition in a consumer's
editor lands on the commented source rather than a stripped `.d.ts`.

## Checks

```bash
npm test              # vectors and laws
npm run examples      # compiles and runs every example
npm run test:coverage # thresholds live in jest.config.js
```

Coverage thresholds are higher than an application's. The laws here _are_ the
product, so an untested branch is an unchecked law.
