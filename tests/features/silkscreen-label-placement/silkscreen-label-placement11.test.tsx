import { expect, test } from "bun:test"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels move off the board information text", async () => {
  const { circuit } = getTestFixture({
    platform: {
      printBoardInformationToSilkscreen: true,
      projectName: "MYPROJECT",
      version: "1.0.0",
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <pcbnotetext
        pcbY={4.4}
        fontSize={0.4}
        text="R1's default label falls on the board information: it moves"
      />
      {/* Turned over, so its default label is 1.22 mm below the part */}
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={3.5}
        pcbY={-2.78}
        pcbRotation={180}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const texts = circuit.db.pcb_silkscreen_text.list()
  const boardInformation = texts.find((text) =>
    text.text.startsWith("MYPROJECT"),
  )!
  const r1Label = texts.find((text) => text.text === "R1")!
  expect(
    doBoundsShareArea(getTextBounds(r1Label), getTextBounds(boardInformation)),
  ).toBe(false)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
