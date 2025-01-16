import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("elkjs schematic autolayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" schAutoLayoutEnabled>
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <chip name="U2" footprint="tssop12" pcbX={5} pcbY={0} />
      <chip name="U2.5" footprint="tssop12" pcbX={5} pcbY={0} />
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
      <group>
        <chip name="U3" footprint="sot23" pcbX={5} pcbY={0} />
        <resistor
          name="R3"
          pcbX={-5}
          pcbY={0}
          schRotation={90}
          resistance={100}
          footprint="0402"
        />
      </group>
      <trace from=".U3 > .pin1" to=".R3 > .pin1" />
      <resistor
        name="R4"
        pcbX={-4}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
      <trace from=".U2 > .pin1" to=".R2 > .pin1" />
      <trace from=".U1 > .pin2" to=".R4 > .pin1" />
      <trace from=".U2 > .pin3" to=".R4 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
})
