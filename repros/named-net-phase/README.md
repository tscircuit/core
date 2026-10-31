# Named-net phase selection

AM3352 needs an early native fanout pass for reset, VREF and calibration nets before DDR occupies nearby escape channels. `connection="net.SIGNAL"` should select the whole electrical net, including its port-to-net branches. On main it throws “matched no trace or endpoint”. Selecting only those branches would still omit the Net routing task.

Run:

```sh
bun test tests/features/autoroutingphase-named-net-control.test.tsx tests/features/autoroutingphase-named-net-selection.test.tsx
```

Baseline: 1 pass / 1 fail. The declaration-only control successfully routes; the selector reproduction throws before routing. The inspected PCB snapshot is explicitly that successful control, not an unresolved board.

Benchmark effect: this reproduction changes no production code or solver dependency. Control completes in about 0.27 s of test time locally; the failing selector completes no routing. These single-run numbers establish behavior, not a performance claim. The stacked fix will compare the same fixtures and the existing phase-selection suite. Bus-lanes solver and its 11-sample benchmark are unchanged by this Core-only phase-selection reproduction.
