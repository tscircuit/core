import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("remote autorouter 2 with circuit json as input", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" schAutoLayoutEnabled>
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <chip name="U2" footprint="tssop12" pcbX={5} pcbY={0} />
      <chip name="U2.5" footprint="tssop12" pcbX={5} pcbY={0} />
      <chip name="U3" footprint="sot23" pcbX={5} pcbY={0} />
      <chip name="U3.5" footprint="sot23" pcbX={5} pcbY={0} />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
        schRotation={90}
      />
      <resistor
        name="R2"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <resistor
        name="R3"
        pcbX={-5}
        pcbY={0}
        schRotation={90}
        resistance={100}
        footprint="0402"
      />
      <resistor
        name="R4"
        pcbX={-4}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
})
