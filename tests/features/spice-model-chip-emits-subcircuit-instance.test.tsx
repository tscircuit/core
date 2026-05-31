import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const lm358Model = `
.subckt LM358 1 2 3 4 5
RIN 2 3 10Meg
.ends LM358
`

test("chip spiceModel emits simulation_spice_subcircuit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "OUT",
          pin2: "IN-",
          pin3: "IN+",
          pin4: "V-",
          pin5: "V+",
        }}
        spiceModel={
          <spicemodel
            source={lm358Model}
            spicePinMapping={{
              "1": "pin1",
              "2": "pin2",
              "3": "pin3",
              "4": "pin4",
              "5": "pin5",
            }}
          />
        }
      />
    </board>,
  )

  circuit.render()

  const spiceInstances = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "simulation_spice_subcircuit")

  expect(spiceInstances).toHaveLength(1)
  expect(spiceInstances[0]).toMatchObject({
    source_component_id: "source_component_0",
    subcircuit_source: lm358Model,
  })
  expect(Object.keys(spiceInstances[0].spice_pin_to_source_port_map)).toEqual([
    "1",
    "2",
    "3",
    "4",
    "5",
  ])
})
