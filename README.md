# @lapxo/obligations

An implementation. Zero runtime dependencies.

Systems hold facts of the form _"this is acceptable, up to here"_ and _"this is
required, from here"_. Both are ranges on some scale, they arrive from
independent sources, and what you usually need is what they add up to.

This package does that arithmetic. The theory behind it is set out separately,
in [doi.org/10.5281/zenodo.21858428](https://doi.org/10.5281/zenodo.21858428).

```ts
import { chain, compose, unit } from '@lapxo/obligations';

const scale = chain(['none', 'own', 'team', 'region', 'all']);

compose(scale, [
  unit('export', { floor: 'none', ceiling: 'region' }), // one source
  unit('export', { floor: 'none', ceiling: 'own' }), //    another
]);
// → { floor: 'none', ceiling: 'own' }
```

Neither source was edited. Neither knows about the other.

---

## How it works

### A statement is a range

Declare a **scale** — the levels this kind of thing comes in, weakest first.
A statement about a subject puts a **floor** under it and a **ceiling** over
it. What sits between is what that statement accepts.

```
           none      own       team      region    all
           ●━━━━━━━━━━●━━━━━━━━━━●━━━━━━━━━━●━━━━━━━━●
                      └──── accepted ────┘
```

The scale is yours. Levels of detail, durations, voltages, versions, tiers of
service — the library never looks inside a level name.

### Statements combine

Take the highest floor and the lowest ceiling.

```
            none      own       team      region    all
source A    ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
source B    ●━━━━━━━━━●
────────────────────────────────────────────────────────
combined    ●━━━━━━━━━●
```

Three properties worth knowing:

- **Order-independent.** Fold statements as they arrive, from wherever.
- **Closed.** Combining two gives one of the same kind, so you can keep going.
- **Silence contributes nothing.** A source that says nothing leaves the result
  unchanged. Silence is not denial — treating it as denial is how something
  breaks the day an unrelated clause is added.

### The two marks are not symmetric

|                                                |                                     |
| ---------------------------------------------- | ----------------------------------- |
| a **ceiling** can always be lowered by another | take the lowest                     |
| a **floor** cannot be lowered at all           | it records that something _depends_ |
| a floor above a ceiling                        | a contradiction, and a real one     |

A contradiction is a fact about the inputs, not an error in the code. Two
sources genuinely cannot both be satisfied, and the useful thing is to say so —
including **which** levels are lost.

```
           none      own       team      region    all
           ··········▼─────────▲····················
                     └─────────┘
                      nothing here satisfies both
```

---

## Does this fit my problem?

Ask four questions:

> Is there a **scale**? Does something push a **minimum** up? Does something
> press a **maximum** down? Is their **crossing** a situation somebody needs to
> know about?

All four yes → the arithmetic applies unchanged. Only the maximum → you have a
simpler problem, and whatever you already have is fine.

A sample of where all four hold:

| domain         | floor                         | ceiling                          | crossing means         |
| -------------- | ----------------------------- | -------------------------------- | ---------------------- |
| agent tools    | what a job depends on         | what the plan and contract allow | withhold the tool      |
| API schemas    | what a consumer needs         | what a producer emits            | a breaking change      |
| electronics    | minimum operating voltage     | lowest absolute maximum          | no rail works          |
| retention      | a statute says keep           | a regime says delete             | genuinely impossible   |
| service levels | contracted throughput         | actual capacity                  | oversold               |
| freshness      | how current an answer must be | how current the source is        | stale, and knowably so |

Each has a folder under [examples/](examples/) that works it through.

---

## Scales that are not a single ladder

A scale is usually a ladder — each level above the last. It does not have to
be. `order` builds one where two levels sit side by side with neither above the
other, and combining, the four outcomes and `entails` all still work.

```ts
const powerset = order(
  ['none', 'x', 'y', 'both'],
  [
    [true, true, true, true],
    [false, true, false, true],
    [false, false, true, true],
    [false, false, false, true],
  ],
);
```

A relation where two levels have no single lowest common level is refused at
the declaration rather than answered about.

On a plain ladder, combining leaves nothing over — `spectrum` shows it, and
`slack` says so pair by pair without needing to know what a level is worth.
Off a ladder it can, and then what a level is worth has to come from somewhere.

---

## Working in the fast form

Every statement exists twice, and both are exact. `Unit` is strings — readable,
what you write. `Packed` is two numbers — what you check against.

```ts
const pk = packer(scale);
const reg = register(
  pk,
  sources.map((s) => pk.pack(s)),
); // once, at boot

reg.clashesOf(rows); // per request: 0 means nothing contradicts
pk.accepts(reg.fold(rows), pk.maskOf('team')); // may this happen at `team`?
```

`pack` and `unpack` are exact inverses, so nothing is lost either way. And the
fast form answers **which** levels collide for free:

```ts
pk.clashing(joint); // → ['team', 'region']
```

---

## Guides

|                                           |                                                |
| ----------------------------------------- | ---------------------------------------------- |
| [examples/basics/](examples/basics)       | the arithmetic itself — start here             |
| [examples/agents/](examples/agents)       | scales of reach, for software that decides     |
| [examples/sensors/](examples/sensors)     | scales of measurement — finding the broken one |
| [examples/hardware/](examples/hardware)   | scales of volts and of time                    |
| [examples/data/](examples/data)           | scales of duration, of evidence, of cost       |
| [examples/contracts/](examples/contracts) | scales of shape — producers and consumers      |
| [examples/deals/](examples/deals)         | finding agreement instead of refusing it       |
| [examples/budget/](examples/budget)       | scales of a conserved quantity, up a tree      |
| [CONTRIBUTING.md](CONTRIBUTING.md)        | the structure, and how to add an operation     |

```bash
npm test          # the vectors under vectors/, plus the laws
npm run examples  # compiles and runs every example
```

---

## Conformance

The files under `vectors/` define conforming behaviour. Every implementation
runs the same files; if two disagree, the vectors settle it.

An operation with no vector is one nobody can port.

---

## Reference

The theory: [doi.org/10.5281/zenodo.21858428](https://doi.org/10.5281/zenodo.21858428)
