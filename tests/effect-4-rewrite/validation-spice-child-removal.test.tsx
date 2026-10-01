import { expect, test } from "bun:test"
import type { SpiceEngineSimulationResult } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("removing a simulation child cancels its logical job while preserving Group event metadata", async () => {
  const entered = Promise.withResolvers<void>()
  const simulation = Promise.withResolvers<SpiceEngineSimulationResult>()
  const { circuit } = getTestFixture({
    platform: {
      pcbDisabled: true,
      schematicDisabled: true,
      drcChecksDisabled: true,
      spiceEngineMap: {
        fake: {
          simulate: () => {
            entered.resolve()
            return simulation.promise
          },
        },
      },
    },
  })
  circuit.add(
    <board name="simulation-board" routingDisabled>
      <voltagesource name="V1" voltage="5V" />
      <resistor name="R1" resistance="1k" />
      <trace from=".V1 > .pin1" to=".R1 > .pin1" />
      <trace from=".V1 > .pin2" to=".R1 > .pin2" />
      <analogsimulation
        name="removed-simulation"
        spiceEngine="fake"
        duration="1ms"
        timePerStep="100us"
      />
    </board>,
  )
  const events: { phase?: string; displayName?: string }[] = []
  circuit.on("asyncEffect:start", (event) => {
    if (event.effectName?.startsWith("spice-simulation"))
      events.push({
        phase: event.phase,
        displayName: event.componentDisplayName,
      })
  })
  const settled = circuit.renderUntilSettled()
  await entered.promise
  expect(events).toEqual([
    {
      phase: "SimulationSpiceEngineRender",
      displayName: circuit.firstChild!.getString(),
    },
  ])
  const removed = circuit.selectOne("analogsimulation.removed-simulation")!
  removed.parent!.remove(removed)
  await settled
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  simulation.resolve({
    simulationResultCircuitJson: [
      {
        type: "simulation_dc_operating_point_voltage",
        simulation_dc_operating_point_voltage_id: "late",
        simulation_experiment_id: "fake",
        simulation_voltage_probe_id: "fake-probe",
        voltage: 5,
      },
    ],
  })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(circuit.db.simulation_dc_operating_point_voltage.list()).toHaveLength(
    0,
  )
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  await circuit.dispose()
})
