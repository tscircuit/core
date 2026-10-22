import { expect, test } from "bun:test"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a <footprint>'s {NAME} text is placed like a footprint string's label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="8mm" routingDisabled>
      <pcbnotetext
        pcbY={3.4}
        fontSize={0.4}
        text="An imported footprint puts U1's {NAME} text on its pads: it moves"
      />
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.8}
              pcbY={0}
              shape="rect"
              width={1}
              height={1.2}
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0.8}
              pcbY={0}
              shape="rect"
              width={1}
              height={1.2}
            />
            <silkscreentext
              text="{NAME}"
              pcbX={0}
              pcbY={0}
              anchorAlignment="center"
              fontSize={1}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const u1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "U1")!
  const labelBounds = getTextBounds(u1Label)
  for (const pad of circuit.db.pcb_smtpad.list()) {
    if (pad.shape !== "rect") continue
    expect(
      doBoundsShareArea(labelBounds, {
        minX: pad.x - pad.width / 2,
        maxX: pad.x + pad.width / 2,
        minY: pad.y - pad.height / 2,
        maxY: pad.y + pad.height / 2,
      }),
    ).toBe(false)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
