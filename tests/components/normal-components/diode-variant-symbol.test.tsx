import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode variant prop selects the schematic symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <diode name="D1" variant="schottky" />
      <diode name="D2" schottky />
      <diode name="D3" variant="zener" />
      <diode name="D4" zener />
      <diode name="D5" variant="avalanche" />
      <diode name="D6" variant="photo" />
      <diode name="D7" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComps = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "schematic_component") as any[]
  const bySourceId = Object.fromEntries(
    schematicComps.map((c) => [c.source_component_id, c.symbol_name]),
  )
  const sourceComps = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "source_component") as any[]
  const symbolOf = (name: string) =>
    bySourceId[sourceComps.find((c) => c.name === name)?.source_component_id]

  expect(symbolOf("D1")).toContain("schottky")
  expect(symbolOf("D2")).toContain("schottky")
  expect(symbolOf("D3")).toContain("zener")
  expect(symbolOf("D4")).toContain("zener")
  expect(symbolOf("D5")).toContain("avalanche")
  expect(symbolOf("D6")).toContain("photodiode")
  expect(symbolOf("D7")).toContain("diode")
  expect(symbolOf("D7")).not.toContain("schottky")
})
