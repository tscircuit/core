import { expect, test } from "bun:test"
import { createPcbLayerStackSvg } from "tests/fixtures/create-pcb-layer-stack-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaPortsEveryLayerBoard } from "tests/fixtures/via-layer-ports-board"

test("snapshot through-via ports on every PCB layer", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ViaPortsEveryLayerBoard />)
  await circuit.renderUntilSettled()

  const layerStackSvg = createPcbLayerStackSvg(circuit.getCircuitJson())
  await expect(layerStackSvg).toMatchSvgSnapshot(
    import.meta.path,
    "repro-via-inner2-ports-layers",
    { diffThresholdPercent: 0 },
  )
})
