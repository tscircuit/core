import { expect, test } from "bun:test"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels stay off other parts' courtyards, which hide them", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" routingDisabled>
      <pcbnotetext
        pcbY={4.4}
        fontSize={0.4}
        text="U1 is a body over two pads, with no silkscreen; R1's default label falls on it"
      />
      <chip
        name="U1"
        pcbX={0}
        pcbY={1.5}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2.5}
              pcbY={0}
              shape="rect"
              width={0.8}
              height={0.8}
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={2.5}
              pcbY={0}
              shape="rect"
              width={0.8}
              height={0.8}
            />
            <courtyardrect pcbX={0} pcbY={0} width="6.5mm" height="4mm" />
          </footprint>
        }
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={-1.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  const u1Courtyard = circuit.db.pcb_courtyard_rect
    .list()
    .find((courtyard) => courtyard.width === 6.5)!
  expect(
    doBoundsShareArea(getTextBounds(r1Label), {
      minX: u1Courtyard.center.x - 3.25,
      maxX: u1Courtyard.center.x + 3.25,
      minY: u1Courtyard.center.y - 2,
      maxY: u1Courtyard.center.y + 2,
    }),
  ).toBe(false)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
