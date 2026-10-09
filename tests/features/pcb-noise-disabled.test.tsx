import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard } from "tests/fixtures/pcb-noise-board"

test("disabled PCB rendering emits no pending physical noise inputs", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(<NoiseBoard />)
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_experiment.list()).toHaveLength(0)
  expect(circuit.db.simulation_pcb_noise_configuration.list()).toHaveLength(0)
})
