import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyPart } from "lib/components/primitive-components/AssemblyPart"
import { AssemblyDevice } from "lib/components/primitive-components/AssemblyDevice"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("BOM edits retain identity, clear metadata, reparent children and remove detached subtrees", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="device">
      <assembly.part
        name="part"
        purchaseUrls={["https://store.example/old"]}
        supplierPartNumbers={{ jlcpcb: ["C1"] }}
      >
        <assembly.part name="child" />
      </assembly.part>
    </assembly.device>,
  )
  circuit.render()
  const part = circuit.selectOne(".part") as AssemblyPart
  const device = circuit.firstChild as AssemblyDevice
  const before = circuit.db.cad_assembly_bom_item
    .list()
    .find((entry) => entry.name === "part")!
  part.setProps({
    ...part.props,
    bomQuantity: 5,
    displayName: "Renamed part",
    purchaseUrls: undefined,
    supplierPartNumbers: {},
  })
  device.setProps({ ...device.props, bomQuantity: 2 })
  circuit.render()
  const updated = circuit.db.cad_assembly_bom_item.get(
    before.cad_assembly_bom_item_id,
  )!
  expect(updated).toMatchObject({
    name: "Renamed part",
    quantity: 5,
    supplier_part_numbers: {},
  })
  expect(updated.purchase_urls).toBeUndefined()
  expect(updated.parent_cad_assembly_bom_item_id).toBe(
    circuit.db.cad_assembly_bom_item
      .list()
      .find((entry) => entry.name === "device")?.cad_assembly_bom_item_id,
  )
  device.setProps({ ...device.props, bomQuantity: undefined })
  circuit.render()
  expect(circuit.db.cad_assembly_bom_item.list()).toHaveLength(2)
  expect(
    circuit.db.cad_assembly_bom_item.get(before.cad_assembly_bom_item_id)
      ?.parent_cad_assembly_bom_item_id,
  ).toBeUndefined()
  device.remove(part)
  circuit.render()
  expect(circuit.db.cad_assembly_bom_item.list()).toHaveLength(0)
  device.add(new AssemblyPart({ name: "replacement", bomQuantity: 2 }))
  circuit.render()
  expect(circuit.db.cad_assembly_bom_item.list()).toMatchObject([
    { name: "replacement", quantity: 2 },
  ])
})
