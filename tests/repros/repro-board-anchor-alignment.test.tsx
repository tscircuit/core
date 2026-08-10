import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const W = 20
const H = 10
const anchor = { x: 10, y: 20 }

const ALIGNMENT_TEST_CASES = [
  { alignment: "top_left", expectedCenter: { x: 20, y: 15 } },
  { alignment: "top_right", expectedCenter: { x: 0, y: 15 } },
  { alignment: "bottom_left", expectedCenter: { x: 20, y: 25 } },
  { alignment: "bottom_right", expectedCenter: { x: 0, y: 25 } },

  { alignment: "center", expectedCenter: { x: 10, y: 20 } },
  { alignment: "top_center", expectedCenter: { x: 10, y: 15 } },
  { alignment: "bottom_center", expectedCenter: { x: 10, y: 25 } },
  { alignment: "center_left", expectedCenter: { x: 20, y: 20 } },
  { alignment: "center_right", expectedCenter: { x: 0, y: 20 } },
] as const

for (const { alignment, expectedCenter } of ALIGNMENT_TEST_CASES) {
  test(`board anchorAlignment="${alignment}" correctly calculates board center`, () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={`${W}mm`}
        height={`${H}mm`}
        boardAnchorPosition={anchor}
        anchorAlignment={alignment}
      >
        <pcbnotetext
          pcbX={anchor.x}
          pcbY={anchor.y}
          fontSize={0.7}
          text={`anchor: ${JSON.stringify(anchor)}\nalignment: ${alignment}\nobserved center: ${JSON.stringify(expectedCenter)}`}
        />
      </board>,
    )
    circuit.render()

    const observedCenter = circuit.db.pcb_board.list()[0]?.center
    expect(observedCenter).toEqual(expectedCenter)
    expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-${alignment}`)
  })
}

test("anchorAlignment takes precedence over legacy boardAnchorAlignment", () => {
  const { circuit } = getTestFixture()
  const expectedCenter = { x: 20, y: 15 }
  circuit.add(
    <board
      width={`${W}mm`}
      height={`${H}mm`}
      boardAnchorPosition={anchor}
      anchorAlignment="top_left"
      boardAnchorAlignment="bottom_right"
    >
      <pcbnotetext
        pcbX={anchor.x}
        pcbY={anchor.y}
        fontSize={0.7}
        text={`anchor: ${JSON.stringify(anchor)}\nalignment: top_left (precedence)\nobserved center: ${JSON.stringify(expectedCenter)}`}
      />
    </board>,
  )
  circuit.render()

  const observedCenter = circuit.db.pcb_board.list()[0]?.center
  expect(observedCenter).toEqual(expectedCenter)
  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-precedence`)
})

test("boardAnchorAlignment works as a fallback when anchorAlignment is omitted", () => {
  const { circuit } = getTestFixture()
  const expectedCenter = { x: 0, y: 25 }
  circuit.add(
    <board
      width={`${W}mm`}
      height={`${H}mm`}
      boardAnchorPosition={anchor}
      boardAnchorAlignment="bottom_right"
    >
      <pcbnotetext
        pcbX={anchor.x}
        pcbY={anchor.y}
        fontSize={0.7}
        text={`anchor: ${JSON.stringify(anchor)}\nboardAnchorAlignment: bottom_right (fallback)\nobserved center: ${JSON.stringify(expectedCenter)}`}
      />
    </board>,
  )
  circuit.render()

  const observedCenter = circuit.db.pcb_board.list()[0]?.center
  expect(observedCenter).toEqual(expectedCenter)
  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-fallback`)
})
