import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro102: current/voltage sources with calc pcb placement and footprint create pcb components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="80mm" height="40mm">
      <currentsource
        name="I1"
        current="1A"
        footprint="0402"
        pcbX="calc(board.minX + 10mm)"
        pcbY="calc(board.maxY - 8mm)"
      />
      <voltagesource
        name="V1"
        voltage="5V"
        footprint="0402"
        pcbX="calc(board.maxX - 10mm)"
        pcbY="calc(board.minY + 8mm)"
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)

  const board = circuit.db.pcb_board.list()[0]
  expect(board).toBeDefined()

  const boardMinX = (board?.center.x ?? 0) - (board?.width ?? 0) / 2
  const boardMaxX = (board?.center.x ?? 0) + (board?.width ?? 0) / 2
  const boardMinY = (board?.center.y ?? 0) - (board?.height ?? 0) / 2
  const boardMaxY = (board?.center.y ?? 0) + (board?.height ?? 0) / 2

  const sourceComponents = circuit.db.source_component.list()
  const pcbComponents = circuit.db.pcb_component.list()

  const getPcbComponent = (name: string) => {
    const sourceComponent = sourceComponents.find(
      (component) => component.name === name,
    )
    return pcbComponents.find(
      (component) =>
        component.source_component_id === sourceComponent?.source_component_id,
    )
  }

  const i1 = getPcbComponent("I1")
  const v1 = getPcbComponent("V1")

  expect(i1).toBeDefined()
  expect(v1).toBeDefined()
  expect(i1?.center.x).toBeCloseTo(boardMinX + 10)
  expect(i1?.center.y).toBeCloseTo(boardMaxY - 8)
  expect(v1?.center.x).toBeCloseTo(boardMaxX - 10)
  expect(v1?.center.y).toBeCloseTo(boardMinY + 8)
})
