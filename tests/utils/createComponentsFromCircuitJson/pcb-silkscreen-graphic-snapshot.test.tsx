import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreengraphic renders in PCB snapshots", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <silkscreengraphic
        layer="top"
        brepShape={{
          outer_ring: {
            vertices: [
              { x: -7, y: -2 },
              { x: -3, y: -2 },
              { x: -3, y: 2 },
              { x: -7, y: 2 },
            ],
          },
          inner_rings: [
            {
              vertices: [
                { x: -6, y: -1 },
                { x: -4, y: -1 },
                { x: -4, y: 1 },
                { x: -6, y: 1 },
              ],
            },
          ],
        }}
      />
      <silkscreengraphic
        layer="bottom"
        brepShape={{
          outer_ring: {
            vertices: [
              { x: 3, y: 0 },
              { x: 5, y: -2 },
              { x: 7, y: 0 },
              { x: 5, y: 2 },
            ],
          },
          inner_rings: [],
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const silkscreenGraphics = circuitJson.filter(
    (elm) => elm.type === "pcb_silkscreen_graphic",
  )

  expect(silkscreenGraphics).toHaveLength(2)
  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
