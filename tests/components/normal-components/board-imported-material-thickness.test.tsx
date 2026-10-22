import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boards preserve imported material and thickness unless explicitly overridden", () => {
  const circuitJson = [
    {
      type: "pcb_board" as const,
      pcb_board_id: "pcb_board_imported",
      center: { x: 0, y: 0 },
      width: 20,
      height: 10,
      num_layers: 2,
      material: "fr1" as const,
      thickness: 1.4,
    },
  ]
  for (const { props, material, thickness } of [
    { props: {}, material: "fr1", thickness: 1.4 },
    {
      props: { material: "fr4" as const, thickness: "0.8mm" },
      material: "fr4",
      thickness: 0.8,
    },
    { props: { thickness: 0 }, material: "fr1", thickness: 0 },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(<board circuitJson={circuitJson} {...props} />)
    circuit.render()
    expect(circuit.db.pcb_board.list()[0]).toMatchObject({
      material,
      thickness,
    })
  }
})
