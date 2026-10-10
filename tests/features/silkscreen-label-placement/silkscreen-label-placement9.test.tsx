import { expect, test } from "bun:test"
import { doBoundsOverlap, getBoundsFromPoints } from "@tscircuit/math-utils"
import { getTextBounds } from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A 1x1 PNG: unlike an SVG, it adds no silkscreen paths, only its graphic
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

test("silkscreen labels move off a PNG silkscreen graphic, which loads asynchronously", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={2.6}
        fontSize={0.4}
        text="A logo covers R1's default label spot: the label moves off it"
      />
      <silkscreengraphic
        imageUrl={PNG_DATA_URL}
        pcbX={0}
        pcbY={1.6}
        width="1.6mm"
        height="1.2mm"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const graphicBounds = getBoundsFromPoints(
    circuit.db.pcb_silkscreen_graphic
      .list()
      .flatMap((graphic) => graphic.brep_shape.outer_ring.vertices),
  )!
  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  expect(doBoundsOverlap(getTextBounds(r1Label), graphicBounds)).toBe(false)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
