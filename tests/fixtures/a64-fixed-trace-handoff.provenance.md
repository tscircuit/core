# A64 fixed-trace handoff

This is the real A64 CPU/DDR board from [autorouter #3698](https://github.com/tscircuit/tscircuit-autorouter/pull/3698).

Captured from Core `fb7f456de0a867c7074a9f196597992e0d1253b9` immediately before `withFixedTraces()`: 607 physical obstacles, 32 completed byte routes, and 43 remaining connections. The capture is unchanged; pad geometry, route points, nets, clearances, and search limits are preserved.

Source: [native DDR benchmark](https://github.com/ShiboSoftwareDev/core-ddr-benchmark/tree/24dc44c166d4258c3538f8b1f66953f1b6f58690), `circuits/a64.json.gz` rendered by `NativeDdrBoard` through Core. [Capture run](https://github.com/tscircuit/core/actions/runs/44468075871).

The repro calls Core's actual fixed-trace handoff and renders the resulting SRJ directly. Before migration, its 32 saved traces become 3,315 extra obstacle rectangles. The same test and capture produce native trace paths after migration.
