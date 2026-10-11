import { simulation } from "lib"
import { expect, test } from "bun:test"
import {
  simulation_experiment,
  simulation_return_current_excitation,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("TSX declares a pending experiment with independent physical ground terminals", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard>
      <simulation.pcbreturncurrentsimulation name="Explicit 5 mA peak return">
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
          trace=".SIGNAL"
        />
      </simulation.pcbreturncurrentsimulation>
      <pcbnotetext text="Signal: U1.OUT → U2.IN" pcbY={-1.4} fontSize={0.45} />
      <pcbnotetext text="Return: U2.GND → U1.GND" pcbY={2.3} fontSize={0.4} />
    </ReturnCurrentBoard>,
  )
  await circuit.renderUntilSettled()

  const [experiment] = circuit.db.simulation_experiment.list()
  const [excitation] = circuit.db.simulation_return_current_excitation.list()
  expect(simulation_experiment.parse(experiment)).toEqual(experiment)
  expect(simulation_return_current_excitation.parse(excitation)).toEqual(
    excitation,
  )
  expect(experiment).toMatchObject({
    name: "Explicit 5 mA peak return",
    experiment_type: "pcb_return_current",
  })
  expect(excitation.current).toBe(0.005)
  expect(excitation.source_port?.resistance).toBe(25)
  expect(excitation.load_port?.resistance).toBe(100)
  expect(excitation.simulation_experiment_id).toBe(
    experiment.simulation_experiment_id,
  )
  expect(excitation.return_sink).toMatchObject({
    contact_type: "pcb_port",
    x: -2,
    y: 1.5,
    layer: "top",
  })
  expect(excitation.return_source).toMatchObject({
    contact_type: "pcb_port",
    x: 2,
    y: 1.5,
    layer: "top",
  })
  expect(excitation.source_port?.reference_pcb_port_id).toBe(
    excitation.return_sink.contact_type === "pcb_port"
      ? excitation.return_sink.pcb_port_id
      : undefined,
  )
  expect(excitation.load_port?.reference_pcb_port_id).toBe(
    excitation.return_source.contact_type === "pcb_port"
      ? excitation.return_source.pcb_port_id
      : undefined,
  )
  const trace = circuit.db.pcb_trace.get(excitation.pcb_trace_id)!
  expect(trace.route[0]).toMatchObject({ x: -2, y: 0 })
  expect(trace.route.at(-1)).toMatchObject({ x: 2, y: 0 })
  expect(circuit.db.simulation_pcb_return_current_result.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
