import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchors accept CSS references to generated NEMA backfaces", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
        name="CONTROL"
        width={42}
        height={42}
        thickness={1.6}
        pcbX={3}
        pcbY={4}
        mountedTo=".MOTOR > .backface"
        mountGap={2}
        routingDisabled
      />
      <assembly.motor name="MOTOR" model="nema17_bodylength40mm" />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const motor = circuit.db.cad_component.list()[0]!
  expect(motor.position.x).toBeCloseTo(3)
  expect(motor.position.y).toBeCloseTo(4)
  expect(motor.position.z).toBeCloseTo(42.8)
  expect(circuit.db.pcb_board.list()[0]!.center).toEqual({ x: 3, y: 4 })
})
