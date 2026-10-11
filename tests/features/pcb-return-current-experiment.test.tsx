import { expect, test } from "bun:test"
import { simulation_experiment } from "circuit-json"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("TSX declares separate pending PCB return-current experiments", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={6} schematicDisabled>
      <simulation.pcbreturncurrentsimulation name="DDR D13 return path" />
      <pcbreturncurrentsimulation />
      <pcbnotetext
        text="Pending experiments: DDR D13 / PCB return current"
        pcbY={0}
        fontSize={0.24}
      />
      <pcbnotetext
        text="No solver or excitation is run during TSX rendering"
        pcbY={-0.6}
        fontSize={0.23}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const experiments = circuit.db.simulation_experiment.list()
  expect(
    experiments.map((experiment) => simulation_experiment.parse(experiment)),
  ).toEqual(experiments)
  expect(
    experiments.map(({ name, experiment_type }) => ({ name, experiment_type })),
  ).toEqual([
    { name: "DDR D13 return path", experiment_type: "pcb_return_current" },
    { name: "PCB return current", experiment_type: "pcb_return_current" },
  ])
  expect(
    new Set(
      experiments.map((experiment) => experiment.simulation_experiment_id),
    ).size,
  ).toBe(2)
  expect(circuit.db.simulation_return_current_excitation.list()).toHaveLength(0)
  expect(circuit.db.simulation_pcb_return_current_result.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
