# Plan: bus lanes with local dogbones and constrained cleanup

Status: proposal, not implemented by this document. Audited September 29, 2026.

## Goal and existing implementation

Make `<autoroutingphase autorouter="bus_lanes" />` route selected signals with
local dogbones at either package when necessary, followed by via-free bus lanes,
coupled differential pairs, curved length tuning, and fewer ordinary turns.
Completion means every selected connection is physically connected and the final
emitted copper passes clearance, length, and pair constraints. Failure must be
explicit; there is no fallback that silently inserts interconnect vias.

The preset already exists: [core PR #3939](https://github.com/tscircuit/core/pull/3939)
introduced it using [bus-lanes-solver](https://github.com/tscircuit/bus-lanes-solver).
It supports fixed-layer terminals, saved fanouts, bus skew and pair skew. The
solver currently rejects required layer changes and pair `traceGap` or
`maxUncoupledLength` constraints. This proposal extends that implementation.
No new repository or `tscircuit/create-repo` request is needed.

Source baseline:

| Repository | Audited revision | Relevant implementation |
| --- | --- | --- |
| core | `8e3150d176ef184229a1a63f349718a6f7a82a67` | `lib/utils/autorouting/BusLanesAutorouter.ts`, `local-autorouter-strategies.ts`, `getPresetAutoroutingConfig.ts`; phase accumulation in `Group.ts` |
| bus-lanes-solver | `94b42af1cdaef591b67e6c5d07a21dd33544ef0a` | `lib/bus-lanes-solver.ts`, `length-tuning.ts`, `vector-visibility.ts`, `route-lengths.ts` |
| fanout-solver | `97118aad5c25e009bc047ea74d1b55e29b1d6706` | `lib/types.ts`, `match-component-dogbone-via-sites.ts`, `route-layer-reserved-source-escapes.ts` |

Core currently pins bus-lanes-solver to an older revision,
`0bc8d071241b18a3e7465a878881abe4998f6384`. Updating that dependency is part of
integration; features found on the solver's main branch are not automatically
available in core.

The [AM3352 experiment](https://tscircuit.com/seveibar/am3352-ram-dogbone-and-single-layer-route-test#pcb)
provides useful geometry and regression targets. Its successful routing uses an
offline-generated, board-specific saved plan. Generalization requires runtime
TypeScript algorithms; copying saved coordinates or wrapping that plan in the
preset would not implement this feature.

## Public API

Keep the existing shorthand and existing phase selectors:

```tsx
<autoroutingphase autorouter="bus_lanes" />
```

Use existing `<bus>` properties `pcbAllowedLayers`, `preferredLayer`,
`preferredLayers`, `pcbTraceWidth`, and `maxLengthSkew`. Use existing
`<differentialpair>` properties `pcbTraceGap`, `maxUncoupledLength`, and
`maxLengthSkew`. There is no second layer or timing configuration to synchronize.
An impedance declaration alone does not establish a physical spacing rule or
prove signal integrity.

Proposed addition to `AutorouterConfig` in `tscircuit/props` (not available yet):

```tsx
<autoroutingphase
  autorouter={{ preset: "bus_lanes", busLanesFanout: "none" }}
/>
```

`busLanesFanout?: "auto" | "none"` defaults to `"auto"` for this preset.
`"none"` preserves the current fixed-layer-only contract. Reject this option
with other presets. Update the TypeScript interface, Zod schema, configuration
normalization, and strategy context together; never mutate parsed user props.
No custom `algorithmFn` is needed for either stage.

The default changes the mixed-layer case from immediate rejection to an attempted
local escape. Document that behavior change. Already compatible terminals and
saved fanouts should retain the zero-additional-via path. Existing callers of the
standalone strict `BusLanesSolver` retain its via-free input/output contract.

## Algorithm boundaries

Add a proposed `BusLanesPipelineSolver` in **bus-lanes-solver**, composing a local
escape primitive from **fanout-solver** with the existing strict lane solver.
Core remains the adapter and phase coordinator. Keep geometric search out of
`Group.ts`; preserve stepping, cancellation, synchronous execution, progress,
debug graphics, and reproducible solver constructor arguments.

Expose an additive signal-dogbone API in fanout-solver. Reuse its site selection
and clearance logic, but return local pad-to-via copper and downstream handoff
terminals. Do not run full boundary fanout. Do not repurpose plane termination:
that mode declares connections complete at a plane, whereas these signals still
need their original destination. Return original endpoint and source-trace
provenance so connectivity and total length remain verifiable.

Use canonical SRJ types at package boundaries. Audit whether pad shape, port
identity, component ownership, via drill and physical barrel span survive core's
SRJ conversion; extend the owning types/converter where necessary. Do not widen
the adapter's existing cast to hide missing geometry. Geometry APIs document
board coordinates in mm, +X right, +Y up, and distinguish points from directions.
Use core's established transforms for footprint-local geometry.

### Pipeline

1. **Resolve constraints and layers.** Build connected constraint groups from
   overlapping buses and differential pairs. Select one signal layer per group
   from the board stack and the intersection of hard allowed-layer constraints.
   Preferences rank legal candidates; they cannot override allowed layers. Use
   existing compatible fixed handoffs first. For unescaped terminals, prioritize
   fewer new vias, then preferences and congestion; retry a bounded set of legal
   alternatives if the first layer cannot route. Treat ordinary selected signals
   outside a bus as singleton groups. Reject unsupported multi-terminal topology
   explicitly until it has a defined routing implementation.
2. **Reserve local escapes at both ends.** Jointly allocate legal dogbone sites
   at either package only for terminals that cannot reach the chosen layer.
   Exposed through-hole/via terminals on that layer need no redundant via.
   Keep compatible manual/saved copper fixed; incompatible fixed handoffs fail
   without being rewritten. A dogbone stops at its local via, not a package or
   board boundary. Respect via-in-pad policy, pad geometry, pitch, board outline,
   and other groups' escape reservations. Never move components automatically.
3. **Route lanes without vias.** Pass immutable escapes and original fixed copper
   to the lane solver. Route differential pairs together using a shared corridor
   and paired geometry, rather than independently routing and checking them only
   afterward. Track reserved copper across groups on every occupied layer.
4. **Tune only as much as needed.** Count fixed prefixes, interconnect, and fixed
   suffixes exactly once. Solve overlapping bus and pair skew constraints jointly.
   Aim for the shortest feasible length interval within the requested tolerance,
   not exact equality or an arbitrary long target. Use smooth, tangent-continuous
   meanders in reserved corridors; derive radius from width, spacing and available
   clearance. Coupled meanders must preserve the inner conductor's radius and
   pair gap. Fail when a legal tuning corridor cannot be found within budget.
5. **Reduce ordinary turns.** Tag tuning regions so curved samples do not count
   as ordinary corners. Replace stair steps and short jogs with fewer horizontal,
   vertical, or 45-degree segments. Preserve matched lengths, or retune and
   revalidate before accepting a replacement. Change a pair jointly; never
   simplify one member independently. Keep smooth meanders and locked copper.
6. **Validate and commit.** Validate the combined physical geometry against
   original endpoints and all constraints, then emit only newly generated traces
   and vias. On failure, preserve earlier phases and publish diagnostics without
   committing partial copper from this phase. No silent global-router fallback.

Only endpoint dogbones may add vias. Through vias occupy their entire physical
stack, including intermediate layers; check copper and drill clearances there.
Blind/buried spans require explicit supported board policy. Do not inherit a
solver's permissive default accidentally.

Pair gap is an edge-to-edge distance, not a centerline distance. Define and test
the shared checker/router interpretation of `maxUncoupledLength` before enabling
support: count uncoupled escape and tuning portions across the entire connection,
not separately resetting the budget at each endpoint. Use the established schema
semantics if defined; resolve ambiguity in the owning schema/checks package.
Report each conductor's uncoupled length and reject any excess. Do not import the
experiment's endpoint exemptions or silently increase a user's budget.

Use analytic curves internally if helpful, but emit a representation supported
by Circuit JSON and downstream fabrication consumers. If discretizing curves,
bound chord error relative to clearance and length tolerances; validate the
emitted copper, not only the ideal curve. No unsupported arc primitives or tiny
coordinate biases to make a checker pass.

## Quality criteria and acceptance

Hard gates take precedence over aesthetic scores:

- All selected original endpoints connected; no shorts, self-touching, or
  nonadjacent self-clearance violations.
- Physical copper, pad, hole, board-edge and full-barrel via DRC passes.
- Every bus/pair skew and explicit coupling constraint passes on total copper.
- No interconnect vias; no changes to locked geometry or component placement.

Among valid candidates, minimize total length and detour, then ordinary direction
changes and short jogs; use new dogbone count in layer selection. Log the separate
metrics instead of hiding regressions inside a weighted sum. A cleanup candidate
must reduce turns without increasing length, degrading coupling, or violating a
hard gate. Keep best valid geometry and bound search/tuning/cleanup effort.

Report per-connection total length, direct endpoint distance, detour ratio and
absolute excess (handle coincident endpoints separately), ordinary turns, short
jogs, minimum curve radius, and nonadjacent self clearance. Also report group
skew, pair gap distributions and uncoupled length, via counts by purpose,
connectivity, DRC, runtime, iterations, and reason for failure. Label search budget
exhaustion separately from incompatible constraints; it is not proof of physical
infeasibility.

Capture AM3352 v0.0.9 as a measured baseline: 47 signals, 94 dogbone vias, no
interconnect vias; approximately 1696.53 mm total copper, worst detour 2.54 and
mean 1.72. Its ordinary-turn cleanup reduced turns from 1830 to 888 without
changing lengths. Re-measure these in the committed fixture harness before using
them as assertions. These are fixture goals, not universal limits for all boards.
The prototype's moved RAM position is part of that fixture's input placement.

## Implementation PR sequence

| Order | Repository | Deliverable and merge gate |
| --- | --- | --- |
| 1 | fanout-solver | Local signal-dogbone primitive, provenance and exact physical via geometry; tests for both endpoints, fixed handoffs, crowded sites and barrel collisions. Publish an additive release. |
| 2 | bus-lanes-solver | Pipeline composition, legal layer selection and fixed-copper accumulation; strict standalone solver unchanged. Tests for zero unnecessary vias, bounded failure and total path accounting. |
| 3 | bus-lanes-solver, checks/schema owners if needed | Coupled routing, explicit gap/uncoupled semantics, curved tuning and constraint-preserving turn cleanup. Benchmark and visually inspect the AM3352 fixture and existing four DDR samples. Publish a release usable by core. |
| 4 | props | Proposed `busLanesFanout` configuration with validation and documentation; publish before core consumes it. This work can proceed alongside solver work. |
| 5 | core | Forward configuration and physical geometry, adapt the pipeline, register debugger support, update dependencies and snapshots, and document the default behavior change and strict opt-out. |

The core PR should touch the existing adapter, preset normalization, strategy
context and solver registry. Preserve the current bus-lanes exception to
`withFixedTraces` obstacle rasterization: exact fixed copper must remain available.
Preserve phase selection and replacement semantics, and return generated copper
only rather than the solver's full input-plus-output snapshot. Later global phases
must treat completed bus copper as fixed obstacles. Do not automatically append
the existing generic `simplify` strategy: its use here requires proof that it
preserves pair and timing constraints; prefer the constrained cleanup above.

## Required verification before shipping

- Extend the five existing `tests/features/autorouter-bus-lanes*.test.tsx`
  fixtures. Preserve the old layer-error assertion under explicit `"none"` and
  add auto-mode success and no-legal-layer failure fixtures.
- Test same-layer terminals with zero added vias, one/both endpoints needing a
  dogbone, already escaped endpoints, plated through-hole terminals, disjoint
  bus-layer masks, unavailable preferred layers, and incompatible locked exits.
- Test pair membership overlapping a bus, unequal fixed fanout lengths, infeasible
  skew/coupling, pin-swap topology requiring crossings, and narrow meander corridors.
- Exercise rotated footprints at 0/90/180/270 degrees on both board sides, translated
  placements, different pitches, widths and clearances. Assert emitted endpoints
  against actual pad geometry, not duplicated transform equations.
- Add negative geometry fixtures for touching meanders, inner-radius violations,
  short-jog shortcuts through obstacles, barrel collisions on other layers, and
  disconnected dogbones. Run native checks on final Circuit JSON as well as the
  solver's independent geometric and connectivity checks.
- Import raw AM3352 input geometry with saved interconnect replay disabled, plus
  its v0.0.9 reference output for comparison. Route all 47 selected signals from
  original terminals; do not let a precomputed route make the algorithm test pass.
- Run the solver repository's four DDR benchmarks and required iteration-zero,
  intermediate and completed visual snapshots. Report connectivity, DRC, total
  copper skew, detour, turn count, coupling and runtime before/after; inspect the
  rendered images. Preserve existing successful cases without gratuitous retuning.
- Test async/sync equivalence, cancellation, deterministic repeated solves, reruns
  without duplicate dogbones, failure rollback, progress/debugger data, phase
  selectors/reroute, and later global routing around fixed bus copper.
- In core, use one test per file with labeled PCB snapshots. Run focused routing
  tests, typecheck, build and repository-required checks for the implementation.

This planning change does not claim a new route or a new DRC pass. The feature is
ready to ship only after the runtime implementation and emitted-board checks pass;
existing experiment results alone do not satisfy those gates.
