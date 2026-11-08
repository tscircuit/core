import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SI declarations coexist with general SPICE transients and voltage probes", async () => {
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
    <DiagnosticBoard>
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
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  expect(netlists).toHaveLength(1)
  expect(netlists[0]).toContain(".tran 0.0001 0.001")
  expect(circuit.db.simulation_experiment.list()).toHaveLength(1)
  expect(circuit.db.simulation_signal_integrity.list()).toHaveLength(1)
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
})
