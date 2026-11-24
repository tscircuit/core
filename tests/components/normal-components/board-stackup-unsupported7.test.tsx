import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("mismatched jlcpcbStackup emits no wrong stackup and lists matching constructions", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04161H-3313",
  })

  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  const warnings = circuit.db.source_property_ignored_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.property_name).toBe("jlcpcbStackup")
  expect(warnings[0]!.message).toContain(
    "Matching constructions for 4-layer 1mm fr4: JLC04101H-7628, JLC04101H-1080, JLC04101H-2116, JLC04101H-3313.",
  )
})
