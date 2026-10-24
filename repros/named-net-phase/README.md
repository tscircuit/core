# Named-net phase selection

AM3352 needs an early native fanout pass for reset, VREF and calibration nets before DDR occupies nearby escape channels. `connection="net.SIGNAL"` should select the whole electrical net, including its port-to-net branches. On main it throws “matched no trace or endpoint”. Selecting only those branches would still omit the Net routing task.

Run:

```sh
bun test tests/features/autoroutingphase-named-net-control.test.tsx tests/features/autoroutingphase-named-net-selection.test.tsx
```

Baseline: 1 pass / 1 fail. The declaration-only control successfully routes; the selector reproduction throws before routing. The inspected PCB snapshot is explicitly that successful control, not an unresolved board.

Benchmark effect: this reproduction changes no production code or solver dependency. Control completes in about 0.27 s of test time locally; the failing selector completes no routing. These single-run numbers establish behavior, not a performance claim. The stacked fix will compare the same fixtures and the existing phase-selection suite. Bus-lanes solver and its 11-sample benchmark are unchanged by this Core-only phase-selection reproduction.


## Stacked fix results

The selector now enrolls the Net routing task and its connected branches.
Without `reroute`, it moves the net from the old phase; with `reroute`, it adds
an early pass and preserves the later net phase. Input props remain immutable.

- New fixtures: **3/3 pass**, 9 assertions, 2.33 s total process time. The early-pass fixture emits no copper itself; the normal later autorouter produces the inspected successful PCB.
- Existing phase fixtures plus the successful control: identical **25 pass / 3 fail** on base and fix, 287 assertions each, 27 files / 28 tests. Process times: base **24.54 s**, fix **23.80 s**, one run each; no speedup claim.
- The same three existing visual failures occur in both runs: emitted-paths parity (0.39%), emitted-paths cache (0.02%), event-index (0.02%). Their snapshots were not updated.
- Production solver dependencies unchanged. This fixes which task reaches the solver; it does not change the bus-lanes search or its 11-sample benchmark.
- Full typecheck could not be established with the reused older local dependency tree: errors include missing CircuitJSON `footprint_origin`/`pcb_stackup`/`PcbSpiceChannel` and missing type resolution in the isolated JLCPCB source dependency. No errors reference the changed phase planner or the new fixtures. CI uses a clean dependency install.

The fix's PCB snapshots were rendered with Node/resvg and inspected: both show the named net physically routed between R1 and R2.
