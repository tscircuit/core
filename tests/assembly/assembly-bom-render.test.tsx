import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { AssemblyBomExample } from "./fixtures/assembly-bom"

test("TSX assembly materials emit nested BOM entries with owned CAD references", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<AssemblyBomExample />)
  await circuit.renderUntilSettled()
  const bom = circuit.db.cad_assembly_bom_item.list()
  expect(bom).toHaveLength(3)
  const housing = bom.find((entry) => entry.name === "ABS enclosure")!
  const screws = bom.find((entry) => entry.name === "M3 screws")!
  const module = bom.find((entry) => entry.name === "module")!
  expect(housing).toMatchObject({
    quantity: 2,
    purchase_urls: [
      "https://amazon.com/dp/example",
      "https://store.example/enclosure",
    ],
  })
  expect(housing.parent_cad_assembly_bom_item_id).toBeUndefined()
  expect(screws).toMatchObject({
    quantity: 4,
    parent_cad_assembly_bom_item_id: housing.cad_assembly_bom_item_id,
  })
  expect(screws.cad_component_ids).toBeUndefined()
  expect(housing.cad_component_ids).toBeUndefined()
  expect(module).toMatchObject({
    quantity: 1,
    parent_cad_assembly_bom_item_id: housing.cad_assembly_bom_item_id,
    supplier_part_numbers: { jlcpcb: ["C123", "C456"] },
  })
  expect(module.cad_component_ids).toHaveLength(2)
  for (const cadId of module.cad_component_ids!) {
    expect(circuit.db.cad_component.get(cadId)?.source_component_id).toBe(
      module.source_component_id,
    )
  }
  for (const entry of bom)
    expect(any_circuit_element.parse(entry)).toMatchObject(entry)
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_assembly_bom_item.list()).toEqual(bom)
})
