import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("a repeated signal trace in one experiment is rejected instead of producing an unusable definition", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard>
      <pcbreturncurrentsimulation>
        <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
        <pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
          current="10mA"
        />
      </pcbreturncurrentsimulation>
    </ReturnCurrentBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "can excite each signal trace only once",
  )
})
