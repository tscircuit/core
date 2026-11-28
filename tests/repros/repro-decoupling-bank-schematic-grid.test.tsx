import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("decoupling bank grid honors schGridRows and gaps", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <schematictext text="3V3 decoupling bank" schY={4.4} fontSize={0.3} />
      <schematictext
        text="schGridRows=2 schGridRowGap=3 schGridColumnGap=2"
        schY={3.8}
        fontSize={0.3}
      />
      <group
        name="Decoupling"
        schGrid
        schGridRows={2}
        schGridRowGap={3}
        schGridColumnGap={2}
      >
        <capacitor
          name="C1"
          capacitance="100nF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C2"
          capacitance="100nF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C3"
          capacitance="100nF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C4"
          capacitance="100nF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C5"
          capacitance="1uF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C6"
          capacitance="1uF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C7"
          capacitance="10uF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
        <capacitor
          name="C8"
          capacitance="10uF"
          schOrientation="vertical"
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  // Two rows of four: C5 starts the second row, directly below C1.
  const [c1, c2, , , c5] = circuit.db.schematic_component.list()
  expect(c5.center.x).toBeCloseTo(c1.center.x)
  expect(c2.center.x - c1.center.x - c1.size.width).toBeCloseTo(2)
  expect(c1.center.y - c5.center.y - c1.size.height).toBeCloseTo(3)
})
