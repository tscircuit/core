import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unmodeled non-boundary chips produce a classified missing-model error", async () => {
  let engineWasCalled = false
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: {
          async simulate() {
            engineWasCalled = true
            return { simulationResultCircuitJson: [] }
          },
        },
      },
    },
  })

  circuit.add(
    <board routingDisabled>
      <chip name="U1" />
      <analogsimulation
        simulationType="spice_dc_operating_point"
        spiceEngine="ngspice"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(engineWasCalled).toBe(false)
  expect(circuit.db.simulation_experiment_error.list()).toEqual([
    expect.objectContaining({
      error_code: "missing_model",
      message: "Missing SPICE model for U1",
      is_fatal: true,
    }),
  ])
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  expect(circuit.db.source_component.list()[0]).toMatchObject({
    is_simulation_boundary: false,
  })
})
