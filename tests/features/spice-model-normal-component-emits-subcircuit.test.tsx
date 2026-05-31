import { expect, test } from "bun:test"
import type { ResistorProps, SpiceModelElement } from "@tscircuit/props"
import type { SourceSimpleResistor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const precisionResistorModel = `
.subckt PRECISION_RES pin1 pin2
R1 pin1 pin2 2k
.ends PRECISION_RES
`

test("normal component spiceModel emits simulation_spice_subcircuit", async () => {
  const { circuit } = getTestFixture()
  const resistorProps = {
    name: "RSPICE",
    resistance: "1k",
    spiceModel: <spicemodel source={precisionResistorModel} />,
  } satisfies ResistorProps & { spiceModel: SpiceModelElement }

  circuit.add(
    <board>
      <resistor {...resistorProps} />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const resistorSourceComponent = circuitJson.find(
    (elm): elm is SourceSimpleResistor =>
      elm.type === "source_component" && elm.name === "RSPICE",
  )
  const spiceInstances = circuitJson.filter(
    (elm) => elm.type === "simulation_spice_subcircuit",
  )

  expect(spiceInstances).toHaveLength(1)
  expect(spiceInstances[0]).toMatchObject({
    source_component_id: resistorSourceComponent?.source_component_id,
    subcircuit_source: precisionResistorModel,
  })
  expect(Object.keys(spiceInstances[0].spice_pin_to_source_port_map)).toEqual([
    "pin1",
    "pin2",
  ])
})
