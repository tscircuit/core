import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("unknown or mismatched jlcpcbStackup warns with matching constructions and emits no stackup", async () => {
  const unknownCircuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-9999",
  })

  expect(unknownCircuit.db.pcb_stackup.list()).toHaveLength(0)
  const unknownWarnings =
    unknownCircuit.db.source_property_ignored_warning.list()
  expect(unknownWarnings).toHaveLength(1)
  expect(unknownWarnings[0]!.property_name).toBe("jlcpcbStackup")
  expect(unknownWarnings[0]!.message).toContain("JLC04101H-3313")
  expect(unknownWarnings[0]!.message).toContain("JLC04101H-7628")

  const mismatchCircuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: "1.6mm",
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-3313",
  })

  expect(mismatchCircuit.db.pcb_stackup.list()).toHaveLength(0)
  const mismatchWarnings =
    mismatchCircuit.db.source_property_ignored_warning.list()
  expect(mismatchWarnings).toHaveLength(1)
  expect(mismatchWarnings[0]!.property_name).toBe("jlcpcbStackup")
  expect(mismatchWarnings[0]!.message).toContain("JLC04101H-3313")
  expect(mismatchWarnings[0]!.message).toContain(
    "does not match board construction",
  )
})
