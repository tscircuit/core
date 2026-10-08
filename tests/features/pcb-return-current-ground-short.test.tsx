import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("a signal terminal electrically connected to the selected ground net is rejected", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard>
      <trace from=".U1 > .OUT" to="net.GND" />
      <pcbreturncurrentsimulation>
        <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
      </pcbreturncurrentsimulation>
    </ReturnCurrentBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal terminal ".U1 > .OUT" is electrically connected to ground net "GND"',
  )
  expect(circuit.db.simulation_return_current_excitation.list()).toHaveLength(0)
})
