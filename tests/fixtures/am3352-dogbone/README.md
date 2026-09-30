# AM3352 local dogbone fixture

Uses the AM3352 ZCZ ball map and 18 × 18, 0.8 mm-pitch footprint from
[the AM3352 routing experiment](https://tscircuit.com/seveibar/am3352-ram-dogbone-and-single-layer-route-test),
whose map was transcribed from TI SPRS717L, pages 15–17. Pads are 0.4 mm circles.

The test uses `<fanout autorouter="dogbone"><AM3352 /></fanout>`.
Core invokes the published `@tscircuit/dogbone-solver` autorouter to create
local pad-to-via traces and handoffs. No custom routing function or saved paths
are supplied by the test.

The snapshot labels all 43 VSS balls `G` and all 76 VDD*/CAP_VDD* balls `P`.
Supply domains retain their distinct net names. The remaining 205 balls include
signals and reserved pins: this is a full-pad geometry stress test, not a
recommended electrical connection scheme. Through vias span the four-layer
stack; the default handoff is the first board layer distinct from the pad layer.
There are no copper planes or downstream interconnects in this local escape test.

Assertions cover 324 traces/vias/handoffs and absence of emitted core errors.
The labeled PCB SVG is the visual regression artifact.
