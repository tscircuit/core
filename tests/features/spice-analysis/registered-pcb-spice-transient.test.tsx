import { expect, mock, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("transient simulation calls a registered pcb_spice engine", async () => {
  const simulate = mock(async (_netlist: string) => ({
    simulationResultCircuitJson: [],
  }))
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { pcb_spice: { simulate } } },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource name="V1" voltage="3.3V" />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: ".V1 > .pin1", pin2: ".C1 > .pin1" }}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        connections={{ pin2: ".V1 > .pin2" }}
      />
      <voltageprobe name="out" connectsTo=".C1 > .pin1" />
      <analog.transientsimulation
        spiceEngine="pcb_spice"
        duration="1ms"
        timePerStep="100us"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(simulate).toHaveBeenCalledTimes(1)
  expect(simulate.mock.calls[0]![0]).toContain(".tran 0.0001 0.001")
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
})
