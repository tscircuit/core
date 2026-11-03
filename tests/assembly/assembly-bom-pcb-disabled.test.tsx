import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("all material assembly elements emit BOM records with PCB rendering disabled", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device name="device" bomQuantity={3}>
      <assembly.cadassembly name="group">
        <assembly.part name="part" />
        <assembly.bolt name="bolt" diameter={3} length={8} />
        <assembly.printedpart name="printed" model="soic8" />
        <assembly.motor name="motor" standard="nema17" />
        <assembly.screen
          name="screen"
          connectsTo=".J1"
          width={20}
          height={10}
        />
        <assembly.cable
          name="cable"
          from=".J1"
          to=".J2"
          purchaseUrls={["https://store.example/cable"]}
        />
      </assembly.cadassembly>
    </assembly.device>,
  )
  circuit.render()
  const bom = circuit.db.cad_assembly_bom_item.list()
  expect(bom).toHaveLength(8)
  const device = bom.find((entry) => entry.name === "device")!
  const group = bom.find((entry) => entry.name === "group")!
  expect(device.quantity).toBe(3)
  expect(group.parent_cad_assembly_bom_item_id).toBe(
    device.cad_assembly_bom_item_id,
  )
  expect(
    bom.filter(
      (entry) =>
        entry.parent_cad_assembly_bom_item_id ===
        group.cad_assembly_bom_item_id,
    ),
  ).toHaveLength(6)
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  expect(bom.every((entry) => entry.cad_component_ids === undefined)).toBe(true)
  expect(
    bom.find((entry) => entry.name === "cable")?.source_component_id,
  ).toBeUndefined()
})
