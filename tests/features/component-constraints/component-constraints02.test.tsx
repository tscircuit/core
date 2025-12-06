import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("DEBUG: Group constraint solving", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack width="60mm" height="20mm">
      <group name="group1">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>

      <group name="group2">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>

      <constraint pcb xDist="5mm" left="group1" right="group2" centerToCenter />
    </board>,
  )

  // BEFORE rendering
  console.log("\n=== BEFORE renderUntilSettled ===")
  const g1Pre = circuit.db.pcb_group.getWhere({ name: "group1" })
  const g2Pre = circuit.db.pcb_group.getWhere({ name: "group2" })
  console.log(`G1 center: ${JSON.stringify(g1Pre?.center)}`)
  console.log(`G2 center: ${JSON.stringify(g2Pre?.center)}`)
  await circuit.renderUntilSettled()
  // AFTER rendering
  console.log("\n=== AFTER renderUntilSettled ===")
  const g1 = circuit.db.pcb_group.getWhere({ name: "group1" })
  const g2 = circuit.db.pcb_group.getWhere({ name: "group2" })
  console.log(`G1 center: ${JSON.stringify(g1?.center)}`)
  console.log(`G2 center: ${JSON.stringify(g2?.center)}`)

  const allComps = circuit.db.pcb_component.list()

  // Get source components to find names
  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })
  console.log("54 test", r1Source)

  // Find pcb_components by source_component_id
  const r1 = allComps.find(
    (c) => c.source_component_id === r1Source?.source_component_id,
  )
  const r2 = allComps.find(
    (c) => c.source_component_id === r2Source?.source_component_id,
  )

  console.log(`\nR1 center: (${r1?.center.x}, ${r1?.center.y})`)
  console.log(`R2 center: (${r2?.center.x}, ${r2?.center.y})`)

  // Or debug all components
  console.log("\n=== ALL PCB_COMPONENTS ===")
  allComps.forEach((c) => {
    const source = circuit.db.source_component.get(c.source_component_id)
    console.log(
      `${c.pcb_component_id}: center=(${c.center.x}, ${c.center.y}), source=${source?.name}`,
    )
  })

  const centerDist = distance(g1!.center, g2!.center)
  console.log(`\nDistance: ${centerDist.toFixed(2)}mm`)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
