import { test } from "bun:test"
import { expectArduinoUnoRerouteRegion } from "./repro116-arduino-uno-reroute-utils"

const rerouteRegion = {
  shape: "rect" as const,
  minX: -16,
  maxX: -6,
  minY: -2,
  maxY: 8,
}

test("repro116: arduino uno circuit json can reroute a left middle imported region", async () => {
  await expectArduinoUnoRerouteRegion({
    importMetaPath: import.meta.path,
    label: "REROUTED LEFT MID 10MM",
    rerouteRegion,
    snapshotName: "repro116-arduino-uno-reroute-left-mid",
  })
}, 20_000)
