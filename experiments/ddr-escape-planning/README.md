# Proposal: plan DDR escapes together with movable decouplers

Status: experimental RFC; escape improvement observed, complete-board proof outstanding.

## Problem and intended behavior

A placement can pass pad/footprint overlap checks and still leave no legal signal via beside a BGA pad. Starting an expensive carrier search cannot repair that missing escape. Decouplers can block these sites on the opposite side of the board because through vias occupy every copper layer.

Before carrier routing, attempt a collective escape assignment against all physical pads, holes, vias and fixed copper. If it fails, identify blocking geometry and search a bounded set of permitted capacitor moves. Only return a placement when a joint assignment is feasible. Show a concrete proposed move and the affected signal names when automatic movement is not enabled.

## Proposed contract and integration

1. Add a planning step after physical placement geometry exists and before the first DDR phase in `Group_getRoutingPhasePlans`. Reuse the phase preparation boundary and placement-error reporting. Do not mutate `_parsedProps` or user props; derived placements must be separate data and regenerate the native geometry.
2. Require explicit movable components and a displacement limit. User-locked parts, the processor and memory stay fixed. Add per-decoupler electrical constraints (power-pin association and maximum loop/connection length) before enabling automatic moves in production. Physical placement validity alone does not establish acceptable decoupling.
3. Allocate all DDR escape sites jointly. Reserve copper geometry with net ownership, layer span, clearance and via technology. Pass those exact reservations to downstream routing; invalidate and replan if placement changes. Individually escapable pins are not proof of a jointly feasible fanout.
4. Rank candidates by feasibility and escaped connections, then movement. The prototype checks cardinal offsets 0.1–0.6 mm, with at most 128 assessments. Production needs spatial indexing, incremental regeneration, a hard wall deadline and an early exit once an acceptable assignment exists.
5. Emit readable diagnostics such as “C_DDR11 blocks a DDR escape; move 0.5 mm upward.” Keep component IDs in structured references only. Show the via/clearance region on the PCB and offer the bounded move as an edit.

Board geometry uses right-handed board-world millimetres, +X right and +Y up; positions are points and offsets are directions. Layer top/bottom refer to the PCB Z axis, not the XY direction names.

## Executable prototype

`plan.ts` implements the bounded search with an injected physical/escape assessor. It preserves the input, respects locked positions, rejects invalid placements and returns `escape_feasible` separately from routing success. `plan-board.ts` applies it to the native fixture, regenerating translated capacitor geometry and testing collective dogbones with the common solver. This translation-only adapter is not a general footprint placement engine and does not yet persist the escape reservations into carrier routing.

The small unit test checks search behavior and immutability; it is not a routing benchmark. The board trial used RAM at (0, -25) mm, 2 mm closer to the processor than the earlier proof. A first control retaining the earlier manual capacitor nudges already had 47/47 feasible escapes; it showed no benefit. The committed stress variant removes those two manual nudges while keeping the new RAM position. This is a targeted regression, not an unbiased random-layout sample.

Observed on that variant:

| Measure | Before planning | After planning |
| --- | --- | --- |
| Physical placement check | valid | valid |
| Individually escapable DDR connections | 45/47 | 47/47 |
| Collective escape assignment | failed | feasible |
| Automatic moves | none | C_U1_K8 +0.3 mm Y; C_DDR11 +0.5 mm Y |

The planner used 97 assessments and 176.185 seconds. The two moves match the earlier manual repair without hard-coding their identities or offsets. The original complete-DDR pipeline failed local dogbone assignment in 1.559 seconds; the post-planning run advances to shared-layer routing. It then reached the 120-second external timeout in `route_shared_layers`; all 47 DDR connections were not completed. See `evidence.json`. A fresh byte-0 route passed the solver's clearance/timing screen in 7.206 seconds, then all 11 native checks passed for that prefix. This is 11/47 connections, not a complete DDR bus.

## Reproduce

Run `bash setup.sh` in this directory with Bun and Git installed, then:

```sh
bun test plan.test.ts
mkdir -p results/planning
cp fixture/*.json results/planning/
bun plan-board.ts results/planning
PROOF_ROOT=results/before timeout 120s bun route-all.ts
PROOF_INPUT=results/planning/planned-input.json PROOF_ROOT=results/after timeout 120s bun route-all.ts
```

The 120-second limit is an external experimental budget for each routing trial, not a measured time-to-completion target. Inspect the exit status and reports; timeout is not success. The default complete-DDR attempt keeps all 47 requests together. `route-group.ts` is available to diagnose selected groups without crediting them as whole-board success.

## Evidence and reproducibility limits

These are experimental adapters, outside the production router. Both proposals start from core commit `8b46e058e746d635c07db1b859d182683e8c92c2`; neither branch includes the other proposal. The captured board was rendered with core `a165eb88a9403c6d7855a2c8d2d054eaef9d53ac`, from the local AM3352 board experiment based on `bc85a52da8dcad023a3721ca9c90f7a9d29ea3d6`. It has 221 components, 135 capacitors, DDR3, two USB-A connectors, USB-C power/PD, and additional peripherals. These are new placements of that circuit, not independently designed schematics.

The committed fixture is native pre-routing circuit JSON plus a 47-connection DDR routing input, with zero supplied traces/vias. It is sufficient to repeat the DDR experiment, not to rerun full source rendering. Six physical layers are retained: top/inner2/inner3/bottom for signals, inner1/inner4 reserved for ground. The proof uses 0.1 mm traces/clearance and 0.3/0.15 mm through vias, without via-in-pad. DDR bus skew is at most 0.635 mm and pair skew at most 0.127 mm; the 0.12 mm pair gap is a geometric test setting, not an impedance qualification.

Both experiments use bus-lanes-solver `992e0448aee2c40b0d8fa1d3f0537f364b0e60cc` (0.0.35), with the same `common-solver.patch` applied to both control and treatment. That common investigation patch fixes hole-in-pad rejection, propagates/checks maximum lengths, and caches native copper geometry. Those changes are **not** effects of either proposal. Fanout is the solver's pinned `15857f17beed0f228b2e29544f7ce393af297c86`; native checks are 0.0.264. Results were observed with Bun 1.4.0 on one development machine. Transitive dependencies are not fully locked here; repeated runs and pinned CI dependencies remain required.

The reports distinguish escape feasibility, a validated DDR prefix, all 47 DDR connections, and whole-board completion. No whole-board completion or signal-integrity signoff is claimed. These experiments do not yet satisfy the requested independent complete-board proof.

## Merge gates

- Commit/reproduce complete, native-validated routes for the new layout and an additional held-out placement, including all peripheral/power nets. Do not accept partial copper as a completed board.
- Compare clean base and head using identical inputs, constraints, budgets, and hardware, then repeat with a dependency lock. This common-patch experiment is not a clean-upstream performance benchmark.
- Record success rate, elapsed time including validation, retained valid work, retries, unresolved nets and timing/DRC violations. Publish failures as well as successes.
- Keep behavior opt-in until regressions across the existing DDR corpus and the new boards pass. No merge or production default change is proposed in this PR.
