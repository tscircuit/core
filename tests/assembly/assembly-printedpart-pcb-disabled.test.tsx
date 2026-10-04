import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MotorSpacer } from "./fixtures/motor-spacer"

test("printed parts compile without emitting CAD in schematic-only builds", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device>
      <assembly.motor name="M" standard="nema17" />
      <assembly.printedpart
        name="S"
        jscad={<MotorSpacer />}
        mountedTo="M.backface"
        mountFace="motor"
      />
      <board width={42} height={42} mountedTo="S.board">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  expect(circuit.db.pcb_board.list()).toHaveLength(0)
  expect(circuit.db.schematic_component.list()).toHaveLength(1)
})
