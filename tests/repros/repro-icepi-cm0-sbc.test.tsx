import { expect, test } from "bun:test"
import { IcePiSbc } from "@tscircuit/core-ddr-benchmark/circuits/icepi-sbc"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("route the complete iCE/Pi CM0 SBC with its DDR timing rules", async () => {
  const { circuit } = getTestFixture()
  let initialTraceCount: number | undefined
  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    initialTraceCount ??= simpleRouteJson.traces?.length ?? 0
  })
  circuit.add(<IcePiSbc />)
  await circuit.renderUntilSettled()

  expect(initialTraceCount).toBe(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(280)
  expect(circuit.db.source_net.list()).toHaveLength(247)
  expect(circuit.db.source_bus.list()).toHaveLength(18)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 800,
    shouldDrawRatsNest: false,
    showDebugObjects: false,
    showFabricationNotes: false,
  })
}, 900_000)
