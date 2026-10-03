import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("waits for parts engine selection and warns only for unresolved parts", async () => {
  const { circuit } = getTestFixture()
  let finishLookup!: () => void
  const lookup = new Promise<void>((resolve) => {
    finishLookup = resolve
  })
  const calls: string[] = []
  const partsEngine: PartsEngine = {
    findPart: async ({ sourceComponent }) => {
      if (sourceComponent.type !== "source_component")
        throw new Error("Expected a source component")
      calls.push(sourceComponent.name)
      await lookup
      if (["U1", "R1", "C1", "L1"].includes(sourceComponent.name))
        return { jlcpcb: ["C123"] }
      if (sourceComponent.name === "U2") return {}
      if (sourceComponent.name === "U3") return { jlcpcb: [] }
      throw new Error("Parts service unavailable")
    },
  }
  circuit.add(
    <board routingDisabled partsEngine={partsEngine}>
      <chip name="U1" footprint="soic8" />
      <chip name="U2" footprint="soic8" />
      <chip name="U3" footprint="soic8" />
      <chip name="U4" footprint="soic8" />
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <inductor name="L1" inductance="10uH" footprint="0402" />
    </board>,
  )

  circuit.render()
  expect(calls.sort()).toEqual(["C1", "L1", "R1", "U1", "U2", "U3", "U4"])
  expect(
    circuit.db.source_missing_manufacturer_part_number_warning.list(),
  ).toHaveLength(0)

  finishLookup()
  await circuit.renderUntilSettled()
  const resolvedPart = circuit.db.source_component
    .list()
    .find((part) => part.name === "U1")!
  expect(resolvedPart.manufacturer_part_number).toBeUndefined()
  expect(resolvedPart.supplier_part_numbers).toEqual({ jlcpcb: ["C123"] })
  const warnedNames = circuit.db.source_missing_manufacturer_part_number_warning
    .list()
    .map(
      (warning) =>
        circuit.db.source_component.get(warning.source_component_id)?.name,
    )
  expect(warnedNames.sort()).toEqual(["U2", "U3", "U4"])
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(1)
})
