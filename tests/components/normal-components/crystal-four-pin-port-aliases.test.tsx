import { expect, test } from "bun:test"
import { Crystal } from "lib/components/normal-components/Crystal"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four-pin crystal aliases resolve to distinct numbered pins", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="Y1"
        frequency="48MHz"
        loadCapacitance={0}
        pinVariant="four_pin"
        connections={{
          pin1: "net.PIN1_SIGNAL",
          pin2: "net.PIN2_GND",
          pin3: "net.PIN3_SIGNAL",
          pin4: "net.PIN4_GND",
        }}
      />
      <schematictext
        schX={0}
        schY={2}
        text="4-PIN CRYSTAL: GND1=PIN4 (TOP), GND2=PIN2 (BOTTOM)"
        fontSize={0.2}
      />
    </board>,
  )

  circuit.render()

  const crystal = circuit.selectOne("crystal") as Crystal

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
