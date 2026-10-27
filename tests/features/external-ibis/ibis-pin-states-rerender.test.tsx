import { expect, test } from "bun:test"
import type { AnalogTransientSimulation } from "lib/components/primitive-components/AnalogTransientSimulation"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rerenders replace IBIS pin states without changing other experiments", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" pinLabels={{ pin1: "DATA" }} />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="BUFFER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{
          ".U1 > .DATA": { isOutput: true, isOutputEnabled: true },
        }}
      />
      <analog.transientsimulation
        name="quiet"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{ ".U1 > .DATA": { isOutput: false } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const simulation = circuit.selectOne(".run") as AnalogTransientSimulation
  const experimentId = simulation.simulation_experiment_id!
  const otherStates = circuit.db.simulation_ibis_pin_state
    .list()
    .filter((state) => state.simulation_experiment_id !== experimentId)
  const sourcePortId = circuit.db.simulation_ibis_pin_state.list({
    simulation_experiment_id: experimentId,
  })[0].source_port_id

  for (const state of [
    { isOutput: false },
    { isOutput: true, isOutputEnabled: false },
  ] as const) {
    simulation.setProps({
      ...simulation.props,
      ibisPinStates: { ".U1 > .DATA": state },
    })
    await circuit.renderUntilSettled()
    const states = circuit.db.simulation_ibis_pin_state.list({
      simulation_experiment_id: experimentId,
    })
    expect(states).toHaveLength(1)
    expect(states[0]).toMatchObject({
      source_port_id: sourcePortId,
      is_output: state.isOutput,
    })
    if (state.isOutput) expect(states[0].is_output_enabled).toBe(false)
    else expect(states[0]).not.toHaveProperty("is_output_enabled")
  }

  simulation.setProps({ ...simulation.props, ibisPinStates: undefined })
  await circuit.renderUntilSettled()
  expect(simulation.simulation_experiment_id).toBe(experimentId)
  expect(circuit.db.simulation_experiment.list()).toHaveLength(2)
  expect(circuit.db.simulation_ibis_pin_state.list()).toEqual(otherStates)

  simulation.setProps({
    ...simulation.props,
    ibisPinStates: { ".U1 > .DATA": { isOutput: false } },
  })
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_ibis_pin_state.list()).toHaveLength(2)
  simulation.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_experiment.list()).toHaveLength(1)
  expect(circuit.db.simulation_ibis_pin_state.list()).toEqual(otherStates)
})
