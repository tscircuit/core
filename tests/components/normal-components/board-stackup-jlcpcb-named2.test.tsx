import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("unknown jlcpcbStackup emits a property error with matching constructions and no stackup", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-9999",
  })

  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]!.property_name).toBe("jlcpcbStackup")
  expect(errors[0]!.message).toContain("JLC04101H-3313")
  expect(errors[0]!.message).toContain("JLC04101H-7628")
})

test("mismatched jlcpcbStackup emits a property error and no guessed stackup", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: "1.6mm",
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-3313",
  })

  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]!.property_name).toBe("jlcpcbStackup")
  expect(errors[0]!.message).toContain("JLC04101H-3313")
  expect(errors[0]!.message).toContain("does not match board construction")
})
