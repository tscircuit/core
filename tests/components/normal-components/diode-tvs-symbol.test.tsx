import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("TVS props select the bidirectional symbol and allow a unidirectional override", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={10}>
      <diode name="D1" variant="standard" schX={-6} />
      <diode name="D2" variant="tvs" schX={-3} />
      <diode name="D3" tvs schRotation={90} />
      <diode name="D4" tvs symbolName="avalanche_diode" schX={3} />
      <diode name="D5" variant="zener" schX={6} />
    </board>,
  )
  circuit.render()
  expect(
    circuit.db.schematic_component.list().map(({ symbol_name }) => symbol_name),
  ).toEqual([
    "diode_right",
    "bidirectional_tvs_diode_right",
    "bidirectional_tvs_diode_up",
    "avalanche_diode_right",
    "zener_diode_right",
  ])
  const svg = convertCircuitJsonToSchematicSvg(circuit.getCircuitJson())
  expect(svg).not.toContain("Symbol not found")
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
