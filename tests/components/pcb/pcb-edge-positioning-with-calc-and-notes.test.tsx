import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb edge positioning props support calc expressions and are visible in pcb notes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R_LEFT"
        footprint="0402"
        resistance="1k"
        pcbLeftEdgeX="calc(board.minx + 2mm)"
        pcbY="0mm"
      />
      <resistor
        name="R_LEFT_PLUS_2"
        footprint="0402"
        resistance="1k"
        pcbLeftEdgeX="calc(R_LEFT.maxx + 2mm)"
        pcbY="0mm"
      />
      <resistor
        name="R_RIGHT"
        footprint="0402"
        resistance="1k"
        pcbRightEdgeX="calc(board.maxx - 2mm)"
        pcbY="0mm"
      />
      <resistor
        name="R_TOP"
        footprint="0402"
        resistance="1k"
        pcbTopEdgeY="calc(board.maxy - 2mm)"
        pcbX="0mm"
      />
      <resistor
        name="R_BOTTOM"
        footprint="0402"
        resistance="1k"
        pcbBottomEdgeY="calc(board.miny + 2mm)"
        pcbX="0mm"
      />

      <pcbnotetext pcbX={0} pcbY={-8} text="Edge calc anchors" fontSize={1.4} />
      <pcbnotedimension from="R_LEFT" to="R_RIGHT" text="X edge anchors" />
      <pcbnotedimension from="R_BOTTOM" to="R_TOP" text="Y edge anchors" />
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

  const findPcbComponentByName = (name: string) => {
    const source = sourceComponents.find((component) => component.name === name)
    return pcbComponents.find(
      (component) =>
        component.source_component_id === source?.source_component_id,
    )
  }

  const left = findPcbComponentByName("R_LEFT")
  const leftPlus2 = findPcbComponentByName("R_LEFT_PLUS_2")
  const right = findPcbComponentByName("R_RIGHT")
  const top = findPcbComponentByName("R_TOP")
  const bottom = findPcbComponentByName("R_BOTTOM")

  expect(left).toBeDefined()
  expect(leftPlus2).toBeDefined()
  expect(right).toBeDefined()
  expect(top).toBeDefined()
  expect(bottom).toBeDefined()

  expect(left?.display_offset_x).toBeCloseTo(
    boardMinX + 2 + (left?.width ?? 0) / 2,
  )
  expect(right?.display_offset_x).toBeCloseTo(
    boardMaxX - 2 - (right?.width ?? 0) / 2,
  )
  expect(leftPlus2?.display_offset_x).toBeCloseTo(
    Number(left?.display_offset_x ?? 0) +
      (left?.width ?? 0) / 2 +
      2 +
      (leftPlus2?.width ?? 0) / 2,
  )
  expect(top?.display_offset_y).toBeCloseTo(
    boardMaxY - 2 - (top?.height ?? 0) / 2,
  )
  expect(bottom?.display_offset_y).toBeCloseTo(
    boardMinY + 2 + (bottom?.height ?? 0) / 2,
  )

  const noteText = circuit.db.pcb_note_text.list()
  const noteDimensions = circuit.db.pcb_note_dimension.list()
  expect(noteText).toHaveLength(1)
  expect(noteDimensions).toHaveLength(2)

  const xDimension = noteDimensions.find((dimension) =>
    (dimension.text ?? "").includes("X edge"),
  )
  const yDimension = noteDimensions.find((dimension) =>
    (dimension.text ?? "").includes("Y edge"),
  )

  expect(xDimension?.from.x).toBeCloseTo(left?.center.x ?? 0)
  expect(xDimension?.from.y).toBeCloseTo(left?.center.y ?? 0)
  expect(xDimension?.to.x).toBeCloseTo(right?.center.x ?? 0)
  expect(xDimension?.to.y).toBeCloseTo(right?.center.y ?? 0)

  expect(yDimension?.from.x).toBeCloseTo(bottom?.center.x ?? 0)
  expect(yDimension?.from.y).toBeCloseTo(bottom?.center.y ?? 0)
  expect(yDimension?.to.x).toBeCloseTo(top?.center.x ?? 0)
  expect(yDimension?.to.y).toBeCloseTo(top?.center.y ?? 0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
