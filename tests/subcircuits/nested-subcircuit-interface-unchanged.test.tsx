import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board-nested subcircuits retain their existing expanded and collapsed behavior", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board>
      <subcircuit name="EXPANDED" schX={-3} exposedNets={["GND"]}>
        <resistor
          name="R1"
          resistance="1k"
          schX={0}
          schY={0}
          connections={{ pin2: "net.GND" }}
        />
        <port name="IN" connectsTo="R1.pin1" />
      </subcircuit>
      <subcircuit name="COLLAPSED" schX={3} showAsSchematicBox>
        <resistor name="R1" resistance="1k" />
        <port name="IN" direction="left" connectsTo="R1.pin1" />
        <port name="OUT" direction="right" connectsTo="R1.pin2" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.schematic_group.list().some((group) => group.show_boundary),
  ).toBe(false)
  expect(
    circuit.db.schematic_port.list().some((port) => port.boundary_position),
  ).toBe(false)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
