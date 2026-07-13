import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSection lays out voltage sources with long names", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group>
      <schematicsection name="sources" />

      <voltagesource
        name="VBUS20_ECOK_IN_OUT"
        voltage={20}
        schSectionName="sources"
      />
      <voltagesource
        name="VBUS5_ECOK_IN_OUT"
        voltage={5}
        schSectionName="sources"
      />
      <voltagesource
        name="VBUS3_ECOK_IN_OUT"
        voltage={3}
        schSectionName="sources"
      />
      <voltagesource
        name="VBUS1_ECOK_IN_OUT"
        voltage={1}
        schSectionName="sources"
      />

      <trace from="VBUS20_ECOK_IN_OUT.pin2" to="net.GND" />
      <trace from="VBUS5_ECOK_IN_OUT.pin2" to="net.GND" />
      <trace from="VBUS3_ECOK_IN_OUT.pin2" to="net.GND" />
      <trace from="VBUS1_ECOK_IN_OUT.pin2" to="net.GND" />

      <trace from="VBUS20_ECOK_IN_OUT.pin1" to="net.NET20" />
      <trace from="VBUS5_ECOK_IN_OUT.pin1" to="net.NET5" />
      <trace from="VBUS3_ECOK_IN_OUT.pin1" to="net.NET3" />
      <trace from="VBUS1_ECOK_IN_OUT.pin1" to="net.NET1" />
    </group>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
