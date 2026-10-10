import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels avoid text placed by hand, which stays put", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={3.6}
        fontSize={0.4}
        text="REV A and R2's label are placed by hand: R1's and R3's labels move off them"
      />
      <silkscreentext text="REV A" pcbX={-2.5} pcbY={1.22} fontSize={0.5} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-2.5}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={1}
        pcbY={-1}
        pcbSx={{ "& silkscreentext": { pcbX: 1.5, pcbY: 2.22 } }}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={2.5}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Distance (mm) from a text's anchor to where it was put or would be by default
  const getDistanceFrom = (text: string, point: { x: number; y: number }) => {
    const { anchor_position } = circuit.db.pcb_silkscreen_text
      .list()
      .find((silkscreenText) => silkscreenText.text === text)!
    return Math.hypot(anchor_position.x - point.x, anchor_position.y - point.y)
  }
  expect(getDistanceFrom("REV A", { x: -2.5, y: 1.22 })).toBeCloseTo(0)
  expect(getDistanceFrom("R2", { x: 2.5, y: 1.22 })).toBeCloseTo(0)
  // An 0402's default label is centered 1.22 mm above the part
  expect(getDistanceFrom("R1", { x: -2.5, y: 1.22 })).toBeGreaterThan(0.1)
  expect(getDistanceFrom("R3", { x: 2.5, y: 1.22 })).toBeGreaterThan(0.1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
