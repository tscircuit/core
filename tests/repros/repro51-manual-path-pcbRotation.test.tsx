import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Connector with resistor and solder jumper circuit layout same net not combine", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="10mm">
      <group>
        <capacitor
          name="C1"
          capacitance="10uF"
          maxVoltageRating={6}
          footprint="0402"
          pcbX={-1}
          pcbY={0}
        />
        <capacitor
          name="C2"
          capacitance="10uF"
          maxVoltageRating={6}
          footprint="0402"
          pcbX={1}
          pcbY={0}
        />
        <trace from="C1.pin1" to="C2.pin1" pcbPath={[{ x: 1, y: 2 }]} />
      </group>
      <group pcbRotation={90} pcbX={4} pcbY={0}>
        <capacitor
          name="C3"
          capacitance="10uF"
          maxVoltageRating={6}
          footprint="0402"
          pcbX={1}
          pcbY={0}
        />
        <capacitor
          name="C4"
          capacitance="10uF"
          maxVoltageRating={6}
          footprint="0402"
          pcbX={-1}
          pcbY={0}
        />
        <trace from="C3.pin1" to="C4.pin1" pcbPath={[{ x: 1, y: 2 }]} />
      </group>
      <group pcbRotation={-90} pcbX={-4} pcbY={0}>
        <capacitor
          name="C5"
          capacitance="10uF"
          maxVoltageRating={6}
          footprint="0402"
          pcbX={1}
          pcbY={0}
        />
        <capacitor
          name="C6"
          capacitance="10uF"
          maxVoltageRating={6}
          footprint="0402"
          pcbX={-1}
          pcbY={0}
        />
        <trace from="C5.pin1" to="C6.pin1" pcbPath={[{ x: 1, y: 2 }]} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
