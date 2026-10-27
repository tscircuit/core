import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ordinary cached transient subcircuits still render", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        native: {
          async simulate() {
            return {
              simulationResultCircuitJson: [
                {
                  type: "simulation_transient_voltage_graph" as const,
                  name: "out",
                  voltage_levels: [0, 1],
                  timestamps_ms: [0, 1],
                  time_per_step: 1,
                  start_time_ms: 0,
                  end_time_ms: 1,
                },
              ],
            }
          },
        },
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <voltageprobe name="out" connectsTo=".R1 > .pin1" />
        <analog.transientsimulation spiceEngine="native" duration="1ms" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component.list()).toHaveLength(1)
})
