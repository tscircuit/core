import { expect, test } from "bun:test"
import { IcePiSbcWithUnroutedSdD3 } from "@tscircuit/core-ddr-benchmark/circuits/icepi-sbc-with-unrouted-sd-d3"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { restoreIcePiFixedCopper } from "tests/fixtures/icepi/sd-d3-fixed-copper"

test("route SD D3 on the full iCE/Pi CM0 SBC around its fixed copper", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <IcePiSbcWithUnroutedSdD3 restoreFixedCopper={restoreIcePiFixedCopper} />,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    { message: expect.stringContaining("has a discontinuous via") },
  ])
  await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "icepi-cm0-sbc-routing-phases",
    undefined,
    { includePreloadedTraces: false },
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "top",
    width: 1200,
    height: 800,
    shouldDrawRatsNest: false,
    shouldDrawErrors: false,
    showCourtyards: false,
    showDebugObjects: false,
    showFabricationNotes: false,
  })
}, 600_000)
