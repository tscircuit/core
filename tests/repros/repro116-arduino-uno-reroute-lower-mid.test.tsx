import { test } from "bun:test"
import { expectArduinoUnoRerouteRegion } from "./repro116-arduino-uno-reroute-utils"

const rerouteRegion = {
  shape: "rect" as const,
  minX: 0,
  maxX: 10,
  minY: -18,
  maxY: -8,
}

test("repro116: arduino uno circuit json can reroute a lower middle imported region", async () => {
  await expectArduinoUnoRerouteRegion({
    importMetaPath: import.meta.path,
    label: "REROUTED LOWER MID 10MM",
    rerouteRegion,
    snapshotName: "repro116-arduino-uno-reroute-lower-mid",
  })
}, 80_000)
