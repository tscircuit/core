import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader female gender changes the implied CAD footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="J1" pinCount={4} gender="female" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cadComponent = circuit.db.cad_component.list()[0]
  expect(cadComponent).toBeDefined()
  expect(cadComponent?.footprinter_string).toContain("_female")
  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})

test("pinheader preserves explicit male footprint override and upgrades bare pinrow/headermodule strings when gender is female", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm" routingDisabled>
      <pinheader
        name="J_EXPLICIT_MALE"
        pinCount={4}
        gender="female"
        footprint="pinrow4_male"
        pcbX={-8}
      />
      <pinheader
        name="J_PITCHED"
        pinCount={4}
        gender="female"
        footprint="pinrow4_p2.54mm"
        pcbX={0}
      />
      <pinheader
        name="J_MODULE"
        pinCount={4}
        gender="female"
        footprint="headermodule4"
        pcbX={8}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const getCadFootprint = (name: string) => {
    const source = circuit.db.source_component.getWhere({ name })
    return circuit.db.cad_component.getWhere({
      source_component_id: source?.source_component_id,
    })?.footprinter_string
  }

  expect(getCadFootprint("J_EXPLICIT_MALE")).toBe("pinrow4_male")
  expect(getCadFootprint("J_PITCHED")).toBe("pinrow4_p2.54mm_female")
  expect(getCadFootprint("J_MODULE")).toBe("headermodule4_female")
})
