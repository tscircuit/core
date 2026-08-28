import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("analogSimulationDisabled skips model validation and simulation", async () => {
  let simulationCallCount = 0
  const { circuit } = getTestFixture({
    platform: {
      analogSimulationDisabled: true,
      spiceEngineMap: {
        capturing: {
          simulate: async () => {
            simulationCallCount += 1
            return { simulationResultCircuitJson: [] }
          },
        },
      },
    },
  })

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "OUT", pin2: "IN" }}
        spiceModel={<spicemodel source="not a valid SPICE subcircuit" />}
      />
      <analogsimulation
        duration="1ms"
        timePerStep="0.1ms"
        spiceEngine="capturing"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  expect(simulationCallCount).toBe(0)
  expect(
    circuitJson.some(
      (element) => element.type === "simulation_spice_subcircuit",
    ),
  ).toBe(false)
  expect(
    circuitJson.some(
      (element) =>
        element.type === "source_invalid_component_property_error" &&
        element.property_name === "spiceModel",
    ),
  ).toBe(false)
})
