# #4948: routing-disabled placement preview repro

Issue: https://github.com/tscircuit/tscircuit/issues/4948

Verified against `tscircuit/core` main commit
`e0c6b3dea70648169a09836fb4579ea5ba31771b` (`0.0.1921`) with Bun `1.3.14`.
This is a focused reproduction of the diagnostics requirement in #4948,
not a reproduction of the original deleted PCBGolf project.

## Run

From the core repository root, install dependencies with `bun install`, then:

```sh
bun test tests/repros/repro4948-routing-disabled
```

Expected result on the audited main: **2 pass, 0 fail**. The diagnostic assertion
is marked with Bun's `test.failing`: it still executes and asserts the desired
behavior, but its known failure does not make the test command fail. When the
bug is fixed, Bun reports an unexpected pass; remove `.failing` with the fix.

Rendering, snapshot verification and the routing-enabled control run in
`beforeAll`, outside the expected-failure callback, so setup or control failures
still fail the suite. Temporarily change `test.failing` to `test` to see the
original diagnostic assertion failure directly.

## Confirmed bug: preview hides duplicate-name diagnostics

`repro4948-routing-disabled-duplicate-names.test.tsx` renders the same board
with two resistors named `R1` in three modes. It has no connections, keeping
the diagnostic reproduction independent of solver behavior.

| Mode | Expected duplicate-name errors | Actual |
| --- | --- | --- |
| Routing enabled | 1 | 1 |
| Platform `routingDisabled: true` | 1 | 0 |
| Board `routingDisabled` | 1 | 0 |

The error is currently emitted as a `pcb_trace_error` even though duplicate
component naming is independent of copper routing. In
`lib/components/primitive-components/Group/Group.ts`,
`doInitialPcbDesignRuleChecks()` returns for disabled routing before reaching
the duplicate-child-name check.

The expected fix is to preserve that validation when routing is disabled,
while retaining the existing scoping and same-net trace-name exceptions.
No production implementation is changed in this repro.

The snapshot captures the current invalid preview. Duplicate names can alias
rendered component records, so the image is illustrative; the diagnostic
assertion is the regression oracle.

## Passing control: placement does not need a local router or routing cache

`repro4948-routing-disabled-router-cache.test.tsx` uses two uniquely named
resistors connected by a real trace inside a subcircuit.

- With routing enabled, the built-in local router starts, reads/writes its
  cache, and emits copper. This proves the fixture actually demands routing.
- With platform routing disabled, router starts and cache reads/writes are
  all zero, despite a cache implementation that throws when accessed.
- Two PCB components, four PCB ports and one logical source trace remain;
  no generated PCB trace is emitted. The snapshot shows the ratsnest.
- The child has `routingDisabled={false}`, verifying that the root-wide
  preview override still disables its routing.

This control establishes the existing local routing/cache behavior. Remote
routers, CLI configuration, worker lifecycle, and other diagnostic categories
are outside this focused reproduction.

## Validation performed

```sh
bun test tests/repros/repro4948-routing-disabled tests/components/normal-components/board-routing-disabled.test.tsx
```

Result: **3 pass, 0 fail**, including the expected-failure diagnostic test.
The missing duplicate-name diagnostic in both preview modes remains unfixed.
The existing board-level routing-disabled test passes. Biome checks pass for
both new test files.
Both PCB snapshots were rendered to PNG and visually inspected.
