import { expect, test } from "bun:test"
import {
  convertCircuitJsonToAssemblyBom,
  convertCircuitJsonToBomRows,
} from "circuit-json-to-bom-csv"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { AssemblyBomExample } from "./fixtures/assembly-bom"

test("real TSX renders through the assembly BOM converter without CAD-count duplication", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<AssemblyBomExample />)
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const [housing] = await convertCircuitJsonToAssemblyBom({ circuitJson })
  expect(housing.name).toBe("ABS enclosure")
  expect(housing.total_quantity).toBe(1)
  expect(housing.purchase_urls).toHaveLength(2)
  expect(
    housing.children.map((child) => [child.name, child.total_quantity]),
  ).toEqual([
    ["M3 screws", 1],
    ["module", 1],
  ])
  expect(housing.children[1].cad_component_ids).toHaveLength(2)
  expect(housing.children[1].supplier_part_numbers).toEqual({
    jlcpcb: ["C123", "C456"],
  })
  expect(await convertCircuitJsonToBomRows({ circuitJson })).toEqual([])
})
