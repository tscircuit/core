# Desk fidget counter ground trace visibility

This fixture preserves all source and PCB records from the public [desk-fidget-counter v6.0.3 board](https://tscircuit.com/rushabhcodes/desk-fidget-counter?version=6.0.3#pcb), including its full outline, 52 components, 1,277 trace records, 98 vias and all copper-pour polygons. CAD, schematic and source-filesystem metadata are omitted. Only the derived `is_inside_copper_pour` and `copper_pour_id` route annotations are removed so the test exercises core's classification afresh. No copper coordinates, nets, widths or layers are changed, and no routing service is called.

The diagonal near C1 joins a vertical GND continuation at (17.4804, 27.1958) on the top layer. The continuation reaches (17.4804, 14.0995), so the physical junction is continuous. Core's five equally spaced containment samples all lie inside the pour, but the line crosses an actual 0.500697 mm notch between Y=24.249652 and Y=24.750348. Both endpoints receive an inside-pour flag and the renderer skips the entire continuation.

The snapshot shows the full board and a close-up with pour fills hidden, matching the reported viewing condition. Classification still uses every original pour polygon before fills are removed from the rendering copy. The test separately verifies that annotation never changes the actual circuit geometry.

Run with the repository's Bun version:

```sh
bun test tests/repros/repro-desk-fidget-counter-ground-trace
```

The reproduction branch intentionally records the current incorrect display. The dependent fix branch corrects core's containment test and updates this same snapshot to show the continuation. Fixture source: `dist/index/circuit.json` from v6.0.3, SHA-256 `3cb22ecf107f556705a7776302eec3a1c8fe70da766bf196ae2bbbc8d74f0a75`; board source repository [rushabhcodes/desk-fidget-counter](https://github.com/rushabhcodes/desk-fidget-counter), MIT license.

The same reproduction PR also includes `tests/components/primitive-components/copperpour-trace-visibility.test.ts` and its SVG snapshot. Those ten cases show the existing flags and label incorrect hiding explicitly. They assert copper preservation while recording the original display; the fix layer adds assertions for the expected visibility and updates the same SVG to show the correction.
