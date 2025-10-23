import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("comprehensive group constraint example from GitHub issue #1391", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="30mm" pcbLayout={{ pack: true }}>
      <group name="group1" pcbLayout={{ pack: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
      </group>
      
      <group name="group2" pcbLayout={{ pack: true }}>
        <resistor name="R2" resistance="2.2k" footprint="0402" />
        <led name="LED1" footprint="0402" />
      </group>

      {/* This is the exact constraint from the GitHub issue */}
      <constraint pcb xDist="20mm" left=".group1" right=".group2" centerX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Find the groups in the circuit JSON
  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups.length).toBe(2)
  
  const group1 = pcbGroups.find(g => g.name === "group1")
  const group2 = pcbGroups.find(g => g.name === "group2")
  
  expect(group1).toBeDefined()
  expect(group2).toBeDefined()

  // Verify the constraint requirements from the issue:
  // 1. Distance between groups should be 20mm
  const distance = Math.abs(group2!.center.x - group1!.center.x)
  expect(distance).toBeCloseTo(20, 1) // 20mm with 1mm tolerance

  // 2. Both groups should be centered around x=0 (centerX=0)
  const avgX = (group1!.center.x + group2!.center.x) / 2
  expect(avgX).toBeCloseTo(0, 1) // Should be close to 0

  // Additional verification: groups should be at approximately -10 and +10
  const positions = [group1!.center.x, group2!.center.x].sort()
  expect(positions[0]).toBeCloseTo(-10, 1) // Left group at -10mm
  expect(positions[1]).toBeCloseTo(10, 1)  // Right group at +10mm

  console.log(`✅ Group constraint successfully applied:`)
  console.log(`   Group1 position: (${group1!.center.x.toFixed(1)}, ${group1!.center.y.toFixed(1)})`)
  console.log(`   Group2 position: (${group2!.center.x.toFixed(1)}, ${group2!.center.y.toFixed(1)})`)
  console.log(`   Distance: ${distance.toFixed(1)}mm`)
  console.log(`   Center X: ${avgX.toFixed(1)}mm`)
})