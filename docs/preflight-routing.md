# Routing preflight policies

`preflightRoutingCheckPolicy` is optional on boards, subcircuits and autorouting phases. No default is assigned. An explicit phase value wins, then the nearest explicitly configured ancestor. An omitted value inherits; if no value is configured, existing routing behavior is preserved.

```tsx
<board preflightRoutingCheckPolicy="basic">
  <group subcircuit name="controller" preflightRoutingCheckPolicy="conservative">
    <autoroutingphase phaseIndex={0} name="escape" />
    <autoroutingphase phaseIndex={1} name="signals" preflightRoutingCheckPolicy="none" />
  </group>
</board>
```

- `none` bypasses these placement/length/preflight gates. Existing DRC errors remain visible.
- `basic` blocks known placement errors, failed placement checks, and impossible straight-line maximum trace lengths. Local length checks use the current phase's source traces.
- `conservative` also runs `@tscircuit/preflight-routing-check-solver` on the local phase's actual Simple Route JSON. Remote grouped routing checks its SRJ before sending a request.

Local phase checks run before cache lookup or router startup. A blocked phase emits `pcb_preflight_routing_error` and stops subsequent phases while preserving copper from completed phases. Unchanged successful phases retain their routing cache keys. Preflight results are recomputed, not cached.

The initial solver measures connection count, obstacle count and estimated trace density. Density does not block routing. Its blocking diagnostic, `fixed_obstacle_disconnect`, means an optimistic fixed-obstacle model has no connection path even with unrestricted layer changes. Unsupported geometry is recorded as skipped, not declared impossible. Outlines, rotated obstacles, copper pours, jumpers, existing traces and multi-terminal connections are outside the initial connectivity check's scope.

Core steps the solver with a 100 ms elapsed-time budget and yields to the event loop between work slices. `autorouting:preflight` events expose measurements, diagnostics, skipped checks, elapsed time and `completed`, `budget_exhausted` or `failed` status. Exhausting the budget alone does not block routing. An internal solver failure produces `preflight_check_failed`; an explicit `none` permits attempting routing without that check.

Per-phase execution is supported by the grouped local router. Remote routing retains its existing single-request behavior. The legacy sequential-trace router retains placement/length guards but does not run the new geometry solver.
