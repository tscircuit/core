# OrangeCrab fixed-trace handoff

Captured remaining-phase input from the real OrangeCrab TSX/Core DDR benchmark: 385 physical obstacles, 16 completed byte routes, and 34 remaining connections.

The compressed capture expands byte-for-byte to the input from [autorouter #3992](https://github.com/tscircuit/tscircuit-autorouter/pull/3992), blob `39a22700f4d09732a5f6448f4df1a8e3e248ca8f`. No pad geometry, route points, nets, clearances, or routing settings are edited.

The repro calls Core's actual `withFixedTraces()` and snapshots the SRJ passed to the next phase. Before migration, the 16 saved paths become 939 extra obstacle rectangles. The migration changes the emitted representation while the fixture and test remain unchanged.
