# AM3352 local dogbone fixture

Uses the AM3352 ZCZ ball map and 18 × 18, 0.8 mm-pitch footprint from
[the AM3352 routing experiment](https://tscircuit.com/seveibar/am3352-ram-dogbone-and-single-layer-route-test),
whose map was transcribed from TI SPRS717L, pages 15–17. Pads are 0.4 mm circles.

`createAm3352DogbonePaths` runs fanout-solver's public
`matchComponentDogboneViaSites` on every ball on every test run. It emits short
0.1 mm top-layer traces to 0.3/0.15 mm through vias and feeds those generated
paths through core's existing `fanout.pcbTracePaths` interface. It does not replay
precomputed via coordinates or exercise the pending `autorouter="dogbone"` preset.

The snapshot labels all 43 VSS balls `G` and all 76 VDD*/CAP_VDD* balls `P`.
Supply domains retain their distinct net names. The remaining 205 balls include
signals and reserved pins: this is a full-pad geometry stress test, not a
recommended electrical connection scheme. GND handoffs use inner2 and other
handoffs use inner1, with through barrels spanning the four-layer stack.
There are no copper planes or downstream interconnects in this local escape test.

Assertions cover 324 pads/traces/vias/handoffs, unique pad starts, one via per
route, local half-pitch diagonal length, and absence of emitted core errors.
The labeled PCB SVG is the visual regression artifact.
