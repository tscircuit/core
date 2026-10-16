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

test("pinheader female gender with an explicit pinrow footprint selects female CAD footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <pinheader
        name="J1"
        pinCount={4}
        gender="female"
        footprint="pinrow4"
        pcbX={-7}
        pcbY={2}
      />
      <pinheader name="J2" pinCount={4} gender="female" pcbX={7} pcbY={2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const explicitHeader = circuit.db.source_component.getWhere({ name: "J1" })
  const automaticHeader = circuit.db.source_component.getWhere({ name: "J2" })

  const explicitCad = circuit.db.cad_component.getWhere({
    source_component_id: explicitHeader?.source_component_id,
  })
  const automaticCad = circuit.db.cad_component.getWhere({
    source_component_id: automaticHeader?.source_component_id,
  })

  expect(automaticCad?.footprinter_string).toContain("_female")
  expect(explicitCad?.footprinter_string).toBe("pinrow4_female")
})
