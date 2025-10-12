import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnotepath renders transformed route on board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotepath
        strokeWidth={0.25}
        color="#ff66aa"
        route={[
          { x: 0, y: 0 },
          { x: 2.5, y: 1 },
          { x: 5, y: 3 },
        ]}
      />
    </board>,
  )

  circuit.render()

  const paths = circuit.db.pcb_note_path.list()
  expect(paths).toHaveLength(1)
  expect(paths[0]).toMatchObject({
    type: "pcb_note_path",
    route: [
      expect.objectContaining({ x: 0, y: 0 }),
      expect.objectContaining({ x: 2.5, y: 1 }),
      expect.objectContaining({ x: 5, y: 3 }),
    ],
    stroke_width: 0.25,
    color: "#ff66aa",
  })
  expect(paths[0].pcb_component_id).toBeUndefined()
})
