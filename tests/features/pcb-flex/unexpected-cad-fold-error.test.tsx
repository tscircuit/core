import { expect, test } from "bun:test"
import { getFoldedCadComponentPlacement } from "lib/utils/cad/get-folded-cad-component-placement"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unexpected CAD transform failures propagate without becoming placement diagnostics", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={40}
      height={20}
      thickness={0.12}
      material="flex"
      routingDisabled
    >
      <pcbbend
        x1={0}
        y1={-10}
        x2={0}
        y2={10}
        bendAngle={90}
        bendRadius={1}
        bendSide="left"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const resistor = circuit.selectOne("resistor")!
  const board = resistor._getBoard()!
  const failure = new Error("Unexpected CAD transform failure")
  board.pcbFold = {
    ...board.pcbFold!,
    point() {
      throw failure
    },
  }
  const diagnostics = [...circuit.db.pcb_placement_error.list()]
  expect(() =>
    getFoldedCadComponentPlacement(resistor, {
      position: { x: -8, y: 0, z: 0.06 },
      rotation: { x: 0, y: 0, z: 0 },
    }),
  ).toThrow(failure)
  expect(circuit.db.pcb_placement_error.list()).toEqual(diagnostics)
})
