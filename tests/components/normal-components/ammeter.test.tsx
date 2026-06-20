import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<ammeter /> emits source and simulation current probe", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="1k" schX={-3} />
      <resistor name="R2" resistance="1k" schX={3} />
      <ammeter
        name="AM1"
        color="#ff0000"
        display={{
          label: "I_AM1",
          center: 0,
          offsetDivs: 1,
          unitsPerDiv: 0.01,
        }}
        connections={{
          pos: ".R1 > .pin2",
          neg: ".R2 > .pin1",
        }}
      />
      <ammeter
        name="AM2"
        schY={-2}
        connections={{
          pin1: ".R1 > .pin1",
          pin2: ".R2 > .pin2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponents = circuit.db.source_component.list()
  const am1 = sourceComponents.find((elm) => elm.name === "AM1")!
  const am2 = sourceComponents.find((elm) => elm.name === "AM2")!

  expect(am1).toBeDefined()
  expect(am1.ftype).toBe("simple_ammeter")
  expect(am2.ftype).toBe("simple_ammeter")

  const am1Ports = circuit.db.source_port.list({
    source_component_id: am1.source_component_id,
  })
  const am1PosPort = am1Ports.find((port) => port.name === "pin1")!
  const am1NegPort = am1Ports.find((port) => port.name === "pin2")!

  expect(am1PosPort).toBeDefined()
  expect(am1NegPort).toBeDefined()

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces.length).toBe(4)
  expect(
    sourceTraces.map((trace) => trace.display_name).sort(),
  ).toMatchInlineSnapshot(`
      [
        ".AM1 > .neg to .R2 > .pin1",
        ".AM1 > .pos to .R1 > .pin2",
        ".AM2 > .pin1 to .R1 > .pin1",
        ".AM2 > .pin2 to .R2 > .pin2",
      ]
    `)

  const currentProbe = circuit.db.simulation_current_probe.getWhere({
    source_component_id: am1.source_component_id,
  })!

  expect(currentProbe).toMatchObject({
    type: "simulation_current_probe",
    name: "AM1",
    source_component_id: am1.source_component_id,
    positive_source_port_id: am1PosPort.source_port_id,
    negative_source_port_id: am1NegPort.source_port_id,
    color: "#ff0000",
    display_options: {
      label: "I_AM1",
      center: 0,
      offset_divs: 1,
      units_per_div: 0.01,
    },
  })
  expect(currentProbe.subcircuit_id).toBeDefined()

  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: am1.source_component_id,
  })!

  expect(schematicComponent).toBeDefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
