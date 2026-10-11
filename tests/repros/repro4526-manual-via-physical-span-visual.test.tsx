import { expect, test } from "bun:test"
import { createPcbLayerStackSvg } from "tests/fixtures/create-pcb-layer-stack-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ManualViaPhysicalSpanPcbPathBoard } from "tests/fixtures/manual-via-physical-span-pcb-path-board"

test("manual through-via spans on every PCB layer", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ManualViaPhysicalSpanPcbPathBoard />)
  await circuit.renderUntilSettled()

  const layerStackSvg = createPcbLayerStackSvg(circuit.getCircuitJson())
  await expect(layerStackSvg).toMatchSvgSnapshot(
    import.meta.path,
    "repro4526-manual-via-physical-span-layers",
    { diffThresholdPercent: 0 },
  )
})
