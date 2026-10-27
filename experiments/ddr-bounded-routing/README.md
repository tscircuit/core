# Proposal: bounded DDR routing with validated checkpoints

Status: experimental RFC; retained-progress behavior observed, complete-board proof outstanding.

## Problem and intended behavior

A long routing attempt can consume the user's time and then discard useful copper when a later group fails. An iteration counter or a timeout checked inside a solver step cannot interrupt a non-cooperative synchronous step.

Put a supervisor outside the solver worker. Give the entire request an elapsed-time deadline, and each routing/validation attempt a smaller budget. Commit progress only after an independent validator accepts it. A failed or killed attempt must leave the previous checkpoint available and return an explicit incomplete result with unresolved nets and a next action.

## Proposed contract and integration

1. Extend core's existing `create-autorouter-runtime` / `run-threaded-autorouter` ownership boundary. All blocking routing and validation must execute in a terminable worker, including fallback paths. A timeout on the same event loop as the solver is insufficient. Use worker termination in browsers; a supervised process/tree or equivalent on servers.
2. Build stages from `Group_getRoutingPhasePlans`: DDR timing groups, control/reset, then peripherals and power. Route against an immutable accepted prefix. Stage order and alternative strategies must be explicit; checkpointing does not by itself improve routing geometry.
3. Each attempt writes an isolated candidate artifact containing the full proposed prefix. Validate connectivity/endpoints, original net ownership, fixed-copper preservation, physical DRC, via rules, and DDR length/skew/coupling before accepting. The final stage must additionally prove all required board nets connected.
4. Store accepted copper by content hash and atomically publish a manifest with the input/configuration hashes, solver versions, accepted stages, and artifact hash. Include native geometry, constraints, layer stack, seed and solver/validator revision in the configuration identity. Revalidate on resume; reject changed boards/configurations or corrupt artifacts.
5. Use a finite retry policy: change a documented strategy (e.g. layer assignment, finer local grid, group order), never silently relax electrical rules or add layers. Reserve budget for validation and return `incomplete` when it is exhausted. Scope any rip-up to the affected dependency set and preserve the last valid checkpoint until its replacement passes.
6. Report elapsed time, active stage, attempt, committed connection count, unresolved named nets and reason. For example: “DDR byte 0 validated; byte 1 has no accepted route. Saved progress is available.” Include explicit cancellation, checkpoint download/resume, and a congestion overlay.

## Executable prototype and limits

`supervise.ts` is a Bun process adapter outside the production/browser build. It enforces per-process deadlines from the parent, isolates candidate paths, validates before commit, hashes copper, atomically writes the checkpoint, and revalidates on resume. Workers use `ROUTING_FIXED_PATH` and `ROUTING_OUTPUT_PATH`. The validator is trusted code; the supervisor does not infer geometric correctness from JSON.

This is not production integration. It kills the direct child only, so workers must not spawn descendants. Read-only isolation of checkpoint files (the prototype detects modification but passes a writable filesystem path), concurrent writers to the same checkpoint directory, crash-durable fsync/locking, a cancel API, dependency-aware rip-up, browser workers, and final whole-board completion validation remain to be implemented. The total budget bounds solver/validator work, not arbitrary filesystem or user callback latency.

`run-board.ts` tests RAM at (0, -29) mm, 2 mm farther from the processor than the earlier proof and 4 mm from the placement proposal's layout. It retains the earlier physical capacitor placements and does **not** run the other proposal's planner. The prototype tries byte 0, byte 1, then address/control; reset and the peripheral/power stages are not implemented in this runner. A successful configured prefix must never be displayed as a complete board.

Observed in a fresh normal run:

- Byte 0: 11 connections accepted after independent native checks and timing/clearance validation, 10.578 seconds including validation.
- Byte 1: default and finer-grid attempts failed in 0.457 and 0.676 seconds.
- Returned `incomplete` after 11.724 seconds, retaining byte 0 in a content-addressed checkpoint instead of losing it. No complete-DDR or whole-board success.

The complete-DDR monolithic control hit its 120-second external budget in `route_shared_layers` without a completed result. This is a comparison of two orchestration policies, not a claim that the same complete job became faster.

The real deadline-recovery run killed its short attempt after 1.015 seconds, accepted byte 0 on retry, and returned incomplete after 12.828 seconds. Resume revalidated the saved byte lane and retried only byte 1, returning after 3.293 seconds. See `evidence.json`.

The unit test separately kills a deliberately non-cooperative `while(true)` process after a 100 ms budget, validates a fallback, resumes without rerunning it, and rejects a different board. That test uses synthetic output and makes no geometric claim. `deadline_recovery` deliberately gives the real byte-0 router a 1-second first attempt; its purpose is deadline/retry validation, not a representative speed benchmark.

## Reproduce

Run `bash setup.sh` in this directory with Bun and Git installed, then:

```sh
bun test supervise.test.ts supervise-preservation.test.ts
bun run-board.ts incremental
# Reuses and revalidates the saved prefix; retries the incomplete stage:
bun run-board.ts incremental
# A separate fault-injection trial, with a fresh checkpoint directory:
bun run-board.ts deadline_recovery
```

Each normal routing attempt has a 120-second budget, validation 30 seconds, and the request 360 seconds. The runner currently stops when a stage exhausts its finite retries. Keep the fixture, constraint set, layer count and base solver unchanged when comparing policies. Any improvement in retained progress must be reported separately from routing success and time to a completed board.

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
