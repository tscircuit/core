import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boards prefer explicit material and thickness, then imported values, then FR4 at 1.6 mm", () => {
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
  for (const [props, material, thickness] of [
    [{}, "fr4", 1.6],
    [{ material: "fr1", thickness: "0.8mm" }, "fr1", 0.8],
    [{ material: "flex", thickness: 0.2 }, "flex", 0.2],
    [{ circuitJson }, "fr1", 1.4],
    [{ circuitJson, material: "fr4", thickness: "0.8mm" }, "fr4", 0.8],
    [{ circuitJson, thickness: 0 }, "fr1", 0],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<board width={20} height={10} {...props} />)
    circuit.render()
    expect(circuit.db.pcb_board.list()[0]).toMatchObject({
      material,
      thickness,
    })
  }
})
