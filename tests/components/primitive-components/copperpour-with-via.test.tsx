import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pour surrounds centered via on the same net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <via
        pcbX="0mm"
        pcbY="0mm"
        connectsTo="net.GND"
        fromLayer="top"
        toLayer="bottom"
        holeDiameter="0.6mm"
        outerDiameter="1.2mm"
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  console.log(circuit.db.pcb_via.list()[0])
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
