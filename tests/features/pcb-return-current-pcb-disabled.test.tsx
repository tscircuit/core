import { simulation } from "lib"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentConnections,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("PCB-disabled rendering skips pending PCB simulation declarations", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board schematicDisabled>
      <ReturnCurrentConnections />
      <simulation.pcbreturncurrentsimulation>
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
        />
      </simulation.pcbreturncurrentsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_experiment.list()).toHaveLength(0)
  expect(circuit.db.simulation_return_current_excitation.list()).toHaveLength(0)
})
