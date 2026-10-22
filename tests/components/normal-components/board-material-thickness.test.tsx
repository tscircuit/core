import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boards default to FR4 at 1.6 mm and preserve explicit material and thickness", () => {
  for (const { props, material, thickness } of [
    { props: {}, material: "fr4", thickness: 1.6 },
    {
      props: { material: "fr1" as const, thickness: "0.8mm" },
      material: "fr1",
      thickness: 0.8,
    },
    {
      props: { material: "flex" as const, thickness: 0.2 },
      material: "flex",
      thickness: 0.2,
    },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(<board width={20} height={10} {...props} />)
    circuit.render()
    expect(circuit.db.pcb_board.list()[0]).toMatchObject({
      material,
      thickness,
    })
  }
})
