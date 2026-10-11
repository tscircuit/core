import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getViaLayerPortsSvg } from "tests/fixtures/get-via-layer-ports-svg"
import { ViaInner2PortsBoard } from "tests/fixtures/via-layer-ports-board"

test("snapshot through-via ports and inner2 copper", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ViaInner2PortsBoard />)
  await circuit.renderUntilSettled()

  await expect(
    getViaLayerPortsSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
