import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test, expect } from "bun:test"

test("no schematic representation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="30mm">
      <chip
        name="U1"
        footprint="dip8"
        pcbX={-35}
        pcbY={0}
        pinLabels={{
          pin1: "VCC",
          pin2: "INPUT",
          pin3: "OUTPUT",
          pin4: "GND",
          pin5: "NC1",
          pin6: "NC2",
          pin7: "NC3",
          pin8: "NC4",
        }}
        noSchematicRepresentation
      />

      <connector
        name="J1"
        footprint="pinrow4_p2.54"
        pcbX={-12}
        pcbY={0}
        pinLabels={{
          pin1: "VCC",
          pin2: "DATA_P",
          pin3: "DATA_N",
          pin4: "GND",
        }}
        noSchematicRepresentation
      />

      <pushbutton
        name="SW1"
        footprint="pushbutton"
        pcbX={12}
        pcbY={0}
        noSchematicRepresentation
      />

      <pinout
        name="MOD1"
        footprint="dip8"
        pcbX={35}
        pcbY={0}
        pinLabels={{
          pin1: "GND",
          pin2: "GPIO1",
          pin3: "GPIO2",
          pin4: "GPIO3",
          pin5: "GPIO4",
          pin6: "SDA",
          pin7: "SCL",
          pin8: "VCC",
        }}
        noSchematicRepresentation
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicComponents = circuitJson.filter(
    (c) => c.type === "schematic_component",
  )
  const schematicPorts = circuitJson.filter((c) => c.type === "schematic_port")
  expect(schematicComponents.length).toBe(0)
  expect(schematicPorts.length).toBe(0)
})
