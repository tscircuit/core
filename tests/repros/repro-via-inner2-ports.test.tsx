import { expect, test } from "bun:test"
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

  await expect(everyLayerCircuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-top.test.tsx"),
    { layer: "top" },
  )
  await expect(everyLayerCircuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-inner1.test.tsx"),
    { layer: "inner1" },
  )
  await expect(everyLayerCircuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-inner2.test.tsx"),
    { layer: "inner2" },
  )
  await expect(everyLayerCircuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-bottom.test.tsx"),
    { layer: "bottom" },
  )
})
