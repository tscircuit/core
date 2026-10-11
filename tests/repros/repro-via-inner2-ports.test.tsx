import { expect, test } from "bun:test"
import { createPcbLayerStackSvg } from "tests/fixtures/create-pcb-layer-stack-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getViaLayerPortsSvg } from "tests/fixtures/get-via-layer-ports-svg"
import {
  ViaInner2PortsBoard,
  ViaPortsEveryLayerBoard,
} from "tests/fixtures/via-layer-ports-board"

test("snapshot through-via ports and inner2 copper", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ViaInner2PortsBoard />)
  await circuit.renderUntilSettled()

  await expect(
    getViaLayerPortsSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })

  const { circuit: everyLayerCircuit } = getTestFixture()
  everyLayerCircuit.schematicDisabled = true
  everyLayerCircuit.add(<ViaPortsEveryLayerBoard />)
  await everyLayerCircuit.renderUntilSettled()

  const layerStackSvg = createPcbLayerStackSvg(
    everyLayerCircuit.getCircuitJson(),
  )
  await expect(layerStackSvg).toMatchSvgSnapshot(
    import.meta.path,
    "repro-via-inner2-ports-layers",
    { diffThresholdPercent: 0 },
  )
})
