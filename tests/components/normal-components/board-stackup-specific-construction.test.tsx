import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board selects specific JLCPCB stackup construction via jlcpcbStackup prop (#4890)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="100mm"
      height="100mm"
      layers={4}
      thickness={1}
      material="fr4"
      fabricatorPreset="jlcpcb_standard"
      // @ts-ignore: custom stackup prop
      jlcpcbStackup="JLC04101H-3313"
    />,
  )

  await circuit.renderUntilSettled()

  const [stackup] = circuit.db.pcb_stackup.list()
  expect(stackup).toBeDefined()
  expect(stackup.layers).toHaveLength(7)
  // JLC04101H-3313 uses 3313 RC57% prepreg
  expect(stackup.layers[1]).toMatchObject({ material_name: "3313 RC57%" })
  expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
})

test("board selects specific construction using suffix abbreviation e.g. 7628", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="100mm"
      height="100mm"
      layers={4}
      thickness={1}
      material="fr4"
      fabricatorPreset="jlcpcb_standard"
      // @ts-ignore: custom stackup prop
      jlcpcbStackup="7628"
    />,
  )

  await circuit.renderUntilSettled()

  const [stackup] = circuit.db.pcb_stackup.list()
  expect(stackup).toBeDefined()
  // JLC04101H-7628 uses 7628 RC49% prepreg
  expect(stackup.layers[1]).toMatchObject({ material_name: "7628 RC49%" })
  expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
})

test("unknown jlcpcbStackup emits a warning listing available constructions and falls back", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="100mm"
      height="100mm"
      layers={4}
      thickness={1}
      material="fr4"
      fabricatorPreset="jlcpcb_standard"
      // @ts-ignore: custom stackup prop
      jlcpcbStackup="UNKNOWN_STACKUP"
    />,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.source_property_ignored_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.property_name).toBe("jlcpcbStackup")
  expect(warnings[0]!.message).toContain('jlcpcbStackup "UNKNOWN_STACKUP" was not found')
  expect(warnings[0]!.message).toContain("JLC04101H-3313")

  // Still emits fallback stackup
  const [stackup] = circuit.db.pcb_stackup.list()
  expect(stackup).toBeDefined()
})
