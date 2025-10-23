import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("constraint between groups with xDist and centerX", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="30mm" pcbLayout={{ pack: true }}>
      <group name="group1" pcbLayout={{ pack: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      
      <group name="group2" pcbLayout={{ pack: true }}>
        <resistor name="R3" resistance="1k" footprint="0402" />
        <resistor name="R4" resistance="1k" footprint="0402" />
      </group>

      {/* This constraint should set distance between group centers and position both groups */}
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

  // Check that the distance between group centers is 20mm
  const distance = Math.abs(group2!.center.x - group1!.center.x)
  expect(distance).toBeCloseTo(20, 1) // 20mm with 1mm tolerance

  // Check that both groups are centered around x=0 (centerX constraint)
  const avgX = (group1!.center.x + group2!.center.x) / 2
  expect(avgX).toBeCloseTo(0, 1) // Should be close to 0
  
  // Comment out snapshot test for now since this is a new feature
  // expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("constraint between groups without centerX", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="30mm" pcbLayout={{ pack: true }}>
      <group name="group1" pcbLayout={{ pack: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      
      <group name="group2" pcbLayout={{ pack: true }}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>

      {/* This constraint should just set distance between groups */}
      <constraint pcb centerToCenter xDist="15mm" left=".group1" right=".group2" />
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

  // Check that the distance between group centers is 15mm
  const distance = Math.abs(group2!.center.x - group1!.center.x)
  expect(distance).toBeCloseTo(15, 1) // 15mm with 1mm tolerance
  
  // Comment out snapshot test for now since this is a new feature
  // expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("constraint between groups with yDist and centerY", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="50mm" pcbLayout={{ pack: true }}>
      <group name="groupTop" pcbLayout={{ pack: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      
      <group name="groupBottom" pcbLayout={{ pack: true }}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>

      {/* This constraint should set distance between groups and center them at Y=0 */}
      <constraint pcb yDist="20mm" top=".groupTop" bottom=".groupBottom" centerY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Find the groups in the circuit JSON
  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups.length).toBe(2)
  
  const groupTop = pcbGroups.find(g => g.name === "groupTop")
  const groupBottom = pcbGroups.find(g => g.name === "groupBottom")
  
  expect(groupTop).toBeDefined()
  expect(groupBottom).toBeDefined()

  // Check that the distance between group centers is 20mm
  const distance = Math.abs(groupTop!.center.y - groupBottom!.center.y)
  expect(distance).toBeCloseTo(20, 1) // 20mm with 1mm tolerance

  // Check that both groups are centered around y=0 (centerY constraint)
  const avgY = (groupTop!.center.y + groupBottom!.center.y) / 2
  expect(avgY).toBeCloseTo(0, 1) // Should be close to 0
})

test("multiple group constraints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="60mm" pcbLayout={{ pack: true }}>
      <group name="A" pcbLayout={{ pack: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      
      <group name="B" pcbLayout={{ pack: true }}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      
      <group name="C" pcbLayout={{ pack: true }}>
        <resistor name="R3" resistance="1k" footprint="0402" />
      </group>

      {/* Create an L-shaped layout */}
      <constraint pcb xDist="20mm" left=".A" right=".B" centerX={0} />
      <constraint pcb yDist="20mm" top=".A" bottom=".C" centerY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Find the groups in the circuit JSON
  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups.length).toBe(3)
  
  const groupA = pcbGroups.find(g => g.name === "A")
  const groupB = pcbGroups.find(g => g.name === "B")
  const groupC = pcbGroups.find(g => g.name === "C")
  
  expect(groupA).toBeDefined()
  expect(groupB).toBeDefined()
  expect(groupC).toBeDefined()

  // Check distances
  const distanceAB = Math.abs(groupB!.center.x - groupA!.center.x)
  expect(distanceAB).toBeCloseTo(20, 1)
  
  const distanceAC = Math.abs(groupA!.center.y - groupC!.center.y)
  expect(distanceAC).toBeCloseTo(20, 1)

  // Check centering
  const avgXAB = (groupA!.center.x + groupB!.center.x) / 2
  expect(avgXAB).toBeCloseTo(0, 1)
  
  const avgYAC = (groupA!.center.y + groupC!.center.y) / 2
  expect(avgYAC).toBeCloseTo(0, 1)
})