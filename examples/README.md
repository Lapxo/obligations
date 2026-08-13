# Examples

Eight folders, by what the scale _is_. Everything here runs; nothing here ships.

```bash
npm run examples
```

|                           |                                                           |
| ------------------------- | --------------------------------------------------------- |
| [`basics/`](basics)       | the arithmetic itself — start here                        |
| [`agents/`](agents)       | scales of reach, for software that decides                |
| [`sensors/`](sensors)     | scales of measurement — finding the broken one            |
| [`hardware/`](hardware)   | scales of volts, and of time                              |
| [`data/`](data)           | scales of duration, of evidence, of cost                  |
| [`contracts/`](contracts) | scales of shape — producers and consumers                 |
| [`budget/`](budget)       | scales of a conserved quantity, up a tree                 |
| [`deals/`](deals)         | the same arithmetic used to FIND agreement, not refuse it |

The point of the spread: **the arithmetic never changes.** Only what the levels
mean does, and the library never looks inside a level name.

Two of them walk the whole surface end to end, in the order a real caller uses
it — [`agents/full-request.ts`](agents) with software in it, and
[`hardware/board-review.ts`](hardware) with none.
