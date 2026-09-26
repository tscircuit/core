import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inflated circuit JSON preserves rendered copper pours", async () => {
  const { circuit: sourceCircuit } = getTestFixture()
  sourceCircuit.add(
    <board width="20mm" height="16mm">
      <net name="GND" />
      <copperpour connectsTo="net.GND" layer="bottom" />
    </board>,
  )
  await sourceCircuit.renderUntilSettled()
  const renderedCircuitJson = sourceCircuit.getCircuitJson()
  const originalCopperPours = renderedCircuitJson.filter(
    (element) => element.type === "pcb_copper_pour",
  )
  const { circuit } = getTestFixture()
  circuit.add(<board circuitJson={renderedCircuitJson} />)

  await circuit.renderUntilSettled()

  expect(originalCopperPours.length).toBeGreaterThan(0)
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(
    originalCopperPours.length,
  )
  expect(circuit.db.pcb_copper_pour.list()[0]).toMatchObject({
    shape: originalCopperPours[0].shape,
    layer: "bottom",
    source_net_id: circuit.db.source_net.getWhere({ name: "GND" })
      ?.source_net_id,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
