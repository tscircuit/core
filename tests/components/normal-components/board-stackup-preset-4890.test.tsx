import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("4-layer 1.0mm FR4 currently selects JLC04101H-7628", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: "1.0mm",
    fabricatorPreset: "jlcpcb_standard",
  })

  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  expect(stackups[0]!.layers[1]).toMatchObject({
    material_name: "7628 RC49%",
    thickness: 0.2104,
  })
})

test.failing(
  "jlcpcbStackup selects JLC04101H-3313 for a 4-layer 1.0mm FR4 board",
  async () => {
    const circuit = await getBoardStackupFixture({
      width: 20,
      height: 20,
      layers: 4,
      thickness: "1.0mm",
      fabricatorPreset: "jlcpcb_standard",
      // @ts-expect-error - jlcpcbStackup is the proposed API and is not implemented yet
      jlcpcbStackup: "JLC04101H-3313",
    })

    const stackup = circuit.db.pcb_stackup.list()[0]!
    expect(stackup.layers[1]).toMatchObject({
      material_name: "3313 RC57%",
      thickness: 0.0994,
    })
  },
)
