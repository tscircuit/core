import { test } from "bun:test"
import { expectArduinoUnoRerouteRegion } from "./repro116-arduino-uno-reroute-utils"

const rerouteRegion = {
  shape: "rect" as const,
  minX: 8,
  maxX: 18,
  minY: 8,
  maxY: 18,
}

test("repro116: arduino uno circuit json can reroute an imported region with the builtin autorouter", async () => {
  await expectArduinoUnoRerouteRegion({
    dataTestId: "arduino-uno-reroute-left-right-stack",
    importMetaPath: import.meta.path,
    rerouteRegion,
    snapshotName: "repro116-arduino-uno-reroute-left-right",
  })
}, 20_000)
