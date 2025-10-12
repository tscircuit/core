import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnoterect outside a footprint creates a global note rect", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnoterect
        pcbX={2}
        pcbY={3}
        width={4}
        height={2}
        strokeWidth={0.3}
        color="#00ffcc"
        isFilled
      />
    </board>,
  )

  circuit.render()

  const rects = circuit.db.pcb_note_rect.list()
  expect(rects).toHaveLength(1)
  expect(rects[0]).toMatchObject({
    type: "pcb_note_rect",
    center: { x: 2, y: 3 },
    width: 4,
    height: 2,
    stroke_width: 0.3,
    color: "#00ffcc",
    is_filled: true,
    has_stroke: true,
    is_stroke_dashed: false,
  })
  expect(rects[0].pcb_component_id).toBeUndefined()
})
