import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bounded pcbPack groups avoid fixed components outside the group at translated positions", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={10} pcbY={-5} />
      <group name="G" pcbPack pcbX={10} pcbY={-5} width="30mm" height="14mm">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <resistor key={i} name={`R${i}`} resistance="1k" footprint="0603" />
        ))}
      </group>
      <pcbnotetext
        text="G avoids fixed U1"
        pcbX={10}
        pcbY={-14}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const fixed = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name === "U1",
    )!
  expect(fixed.center).toEqual({ x: 10, y: -5 })
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_courtyard_overlap_error"),
  ).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
