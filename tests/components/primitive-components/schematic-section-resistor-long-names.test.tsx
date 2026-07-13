import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSection lays out resistors with long names", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group>
      <schematicsection name="sources" />

      <resistor
        name="RESIS1_ECOK_IN_OUT"
        resistance={20}
        schSectionName="sources"
      />
      <resistor
        name="RESIS2_ECOK_IN_OUT"
        resistance={5}
        schSectionName="sources"
      />
      <resistor
        name="RESIS3_ECOK_IN_OUT"
        resistance={3}
        schSectionName="sources"
      />
      <resistor
        name="RESIS4_ECOK_IN_OUT"
        resistance={1}
        schSectionName="sources"
      />

      <trace from="RESIS1_ECOK_IN_OUT.pin2" to="net.GND" />
      <trace from="RESIS2_ECOK_IN_OUT.pin2" to="net.GND" />
      <trace from="RESIS3_ECOK_IN_OUT.pin2" to="net.GND" />
      <trace from="RESIS4_ECOK_IN_OUT.pin2" to="net.GND" />

      <trace from="RESIS1_ECOK_IN_OUT.pin1" to="net.VCC" />
      <trace from="RESIS2_ECOK_IN_OUT.pin1" to="net.VCC" />
      <trace from="RESIS3_ECOK_IN_OUT.pin1" to="net.VCC" />
      <trace from="RESIS4_ECOK_IN_OUT.pin1" to="net.VCC" />
    </group>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
