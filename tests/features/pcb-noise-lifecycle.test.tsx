import { expect, test } from "bun:test"
import { PcbNoiseChannel, PcbNoiseSimulation, simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard, NoiseSimulation } from "tests/fixtures/pcb-noise-board"

test("pending noise updates and removal preserve other experiments and parsed props", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <NoiseBoard>
      <NoiseSimulation name="Selected noise" />
      <NoiseSimulation name="Preserved noise" />
      <simulation.pcbreturncurrentsimulation name="Preserved return experiment" />
    </NoiseBoard>,
  )
  await circuit.renderUntilSettled()
  const simulations = circuit.selectAll(
    "pcbnoisesimulation",
  ) as PcbNoiseSimulation[]
  const selected = simulations.find(
    (simulation) => simulation._parsedProps.name === "Selected noise",
  )!
  const parsedBefore = structuredClone({
    ...selected._parsedProps,
    children: undefined,
  })
  const configurationId = selected.simulation_pcb_noise_configuration_id!
  const preserved = structuredClone(
    circuit.db.simulation_pcb_noise_configuration
      .list()
      .find(
        (configuration) =>
          configuration.simulation_pcb_noise_configuration_id !==
          configurationId,
      ),
  )
  selected.updatePcbSimulationRender()
  expect({ ...selected._parsedProps, children: undefined }).toEqual(
    parsedBefore,
  )
  expect(selected.simulation_pcb_noise_configuration_id).toBe(configurationId)
  expect(circuit.db.simulation_pcb_noise_configuration.list()).toHaveLength(2)
  const source = selected.children.find(
    (child): child is PcbNoiseChannel => child instanceof PcbNoiseChannel,
  )!
  source.setProps({
    ...source.props,
    waveform: { kind: "dc", voltage: "0.25V" },
  })
  await circuit.renderUntilSettled()
  expect(
    circuit.db.simulation_pcb_noise_configuration.get(configurationId)!
      .sources[0].waveform,
  ).toEqual({ kind: "dc", voltage_v: 0.25 })
  selected.removeSimulationRender()
  expect(circuit.db.simulation_pcb_noise_configuration.list()).toEqual([
    preserved!,
  ])
  expect(
    circuit.db.simulation_experiment
      .list()
      .map((experiment) => experiment.name),
  ).toEqual(["Preserved noise", "Preserved return experiment"])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
