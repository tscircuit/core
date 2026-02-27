import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("constraint between groups with xDist and centerX", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board pcbPack>
      <group name="group1">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      <group name="group2">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      <constraint
        pcb
        centerToCenter
        left=".group1"
        right=".group2"
        xDist="20mm"
        centerX={0}
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

  // The two groups should be 20mm apart center-to-center on x-axis
  const xDist = Math.abs(r2Pcb.center.x - r1Pcb.center.x)
  expect(xDist).toBeCloseTo(20, 0)

  // With centerX=0, the midpoint of the two groups should be at x=0
  const midX = (r1Pcb.center.x + r2Pcb.center.x) / 2
  expect(midX).toBeCloseTo(0, 0)
})

test("constraint between components with xDist and centerX", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board pcbPack>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <constraint
        pcb
        centerToCenter
        left=".R1"
        right=".R2"
        xDist="10mm"
        centerX={0}
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

  // The two components should be 10mm apart center-to-center on x-axis
  const xDist = Math.abs(r2Pcb.center.x - r1Pcb.center.x)
  expect(xDist).toBeCloseTo(10, 0)

  // With centerX=0, the midpoint should be at x=0
  const midX = (r1Pcb.center.x + r2Pcb.center.x) / 2
  expect(midX).toBeCloseTo(0, 0)
})
