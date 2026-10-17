import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("external declarations coexist with an executed native experiment", async () => {
  const netlists: string[] = []
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        capturing: {
          async simulate(netlist: string) {
            netlists.push(netlist)
            return { simulationResultCircuitJson: [] }
          },
        },
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <voltagesource name="V1" voltage="3.3V" />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: ".V1 > .pin1", pin2: ".V1 > .pin2" }}
      />
      <voltageprobe name="out" connectsTo=".R1 > .pin1" />
      <analog.transientsimulation
        name="native"
        spiceEngine="capturing"
        duration="1ms"
        timePerStep="100us"
      />
      <analog.transientsimulation
        name="external"
        executionMode="external"
        spiceEngine="uninstalled"
        duration="20ns"
        timePerStep="20ps"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(netlists).toHaveLength(1)
  expect(netlists[0]).toContain(".tran 0.0001 0.001")
  expect(circuit.db.simulation_experiment.list()).toHaveLength(2)
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
})
