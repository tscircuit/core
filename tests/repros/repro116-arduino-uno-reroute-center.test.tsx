import { test } from "bun:test"
import { expectArduinoUnoRerouteRegion } from "./repro116-arduino-uno-reroute-utils"

const rerouteRegion = {
  shape: "rect" as const,
  minX: -4,
  maxX: 6,
  minY: -4,
  maxY: 6,
}

test("repro116: arduino uno circuit json can reroute a center imported region", async () => {
  await expectArduinoUnoRerouteRegion({
    importMetaPath: import.meta.path,
    label: "REROUTED CENTER 10MM",
    rerouteRegion,
    snapshotName: "repro116-arduino-uno-reroute-center",
    // Linux CI chooses a slightly different route in the center region (0.10%
    // of pixels), while all routing invariants pass. Bound that variation here
    // without relaxing the other reroute snapshots or the geometry assertions.
    pcbSnapshotDiffThresholdPercent: 0.15,
  })
}, 120_000)
