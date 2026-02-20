import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("constraint xDist between groups in relative layout mode", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <group name="group1" pcbX={-5} pcbY={0}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      <group name="group2" pcbX={5} pcbY={0}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      <constraint
        pcb
        centerToCenter
        left=".group1"
        right=".group2"
        xDist="20mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!

  const r1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!
  const r2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!

  // The distance between centers should be 20mm
  const dx = r2Pcb.center.x - r1Pcb.center.x
  expect(Math.abs(dx - 20)).toBeLessThan(0.1)

  // Both should be on same Y
  expect(Math.abs(r2Pcb.center.y - r1Pcb.center.y)).toBeLessThan(0.1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("constraint xDist between components in relative layout mode", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <constraint
        pcb
        centerToCenter
        left=".R1"
        right=".R2"
        xDist="15mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!

  const r1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!
  const r2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!

  const dx = r2Pcb.center.x - r1Pcb.center.x
  expect(Math.abs(dx - 15)).toBeLessThan(0.1)
})

test("constraint sameY between components in relative layout mode", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={3} />
      <constraint pcb sameY for={[".R1", ".R2"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!

  const r1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!
  const r2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!

  // R1 keeps its Y (strong anchor), R2 should match it
  expect(Math.abs(r1Pcb.center.y - r2Pcb.center.y)).toBeLessThan(0.1)
})
