import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("namespaced return-current declarations preserve the flat form's complete Circuit JSON", async () => {
  // Suppress unrelated manufacturing warnings containing global render counters.
  const { circuit: flat } = getTestFixture({
    platform: { drcChecksDisabled: true },
  })
  flat.add(
    <ReturnCurrentBoard>
      <pcbreturncurrentsimulation name="Compatible return-current declaration">
        <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
      </pcbreturncurrentsimulation>
      <pcbnotetext
        text="Flat / simulation namespace: identical PCB"
        pcbY={-1.8}
        fontSize={0.35}
      />
    </ReturnCurrentBoard>,
  )
  const { circuit: namespaced } = getTestFixture({
    platform: { drcChecksDisabled: true },
  })
  namespaced.add(
    <ReturnCurrentBoard>
      <simulation.pcbreturncurrentsimulation name="Compatible return-current declaration">
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
        />
      </simulation.pcbreturncurrentsimulation>
      <pcbnotetext
        text="Flat / simulation namespace: identical PCB"
        pcbY={-1.8}
        fontSize={0.35}
      />
    </ReturnCurrentBoard>,
  )
  await flat.renderUntilSettled()
  await namespaced.renderUntilSettled()
  expect(namespaced.getCircuitJson()).toEqual(flat.getCircuitJson())
  await expect(namespaced).toMatchPcbSnapshot(import.meta.path)
})
