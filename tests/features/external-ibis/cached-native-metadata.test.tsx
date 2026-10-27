import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ordinary cached transient metadata and probes still render", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        native: {
          async simulate() {
            return { simulationResultCircuitJson: [] }
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
  // Main ignores cached simulation metadata; preserve that behavior.
  expect(circuit.db.simulation_experiment.list()).toHaveLength(0)
  expect(circuit.db.simulation_voltage_probe.list()).toHaveLength(0)
})
