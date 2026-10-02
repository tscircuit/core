import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic-only devices keep motor source records without CAD or PCB mounts", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device>
      <assembly.motor
        name="MOTOR"
        standard="nema17"
        shaftFacingDirection="x+"
      />
      <board
        name="B1"
        width={42}
        height={42}
        mountedTo="MOTOR.backface"
        routingDisabled
      >
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
    </assembly.device>,
  )
  circuit.render()
  expect(
    circuit.db.source_component
      .list()
      .some((source) => source.name === "MOTOR"),
  ).toBe(true)
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  expect(circuit.db.pcb_board.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
