import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcbStackup resolves case-insensitively without repeating fabricatorPreset", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1,
    material: "fr4",
    jlcpcbStackup: "jlc04101h-1080",
  })

  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  expect(stackups[0]!.layers[1]).toMatchObject({
    material_name: "1080 RC67%",
    relative_permittivity: 3.91,
  })
  expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
})
