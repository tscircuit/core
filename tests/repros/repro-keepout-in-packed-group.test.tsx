import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Keepout inside a packed group is moved with the group", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" pcbPack pcbPackGap="2mm" routingDisabled>
      <group name="GA">
        <resistor name="R1" resistance="1k" footprint="1206" />
        <keepout
          shape="rect"
          width="6mm"
          height="3mm"
          layers={["top", "bottom"]}
          allowPlacements
          allowTraces
        />
      </group>
      <group name="GB">
        <resistor name="R2" resistance="1k" footprint="1206" />
        <keepout
          shape="rect"
          width="6mm"
          height="3mm"
          layers={["top", "bottom"]}
          allowPlacements
          allowTraces
        />
      </group>
      <group name="GC">
        <resistor name="R3" resistance="1k" footprint="1206" />
        <keepout
          shape="rect"
          width="6mm"
          height="3mm"
          layers={["top", "bottom"]}
          allowPlacements
          allowTraces
        />
      </group>
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const keepouts = circuit.db.pcb_keepout.list()
  const components = circuit.db.pcb_component.list()

  expect(keepouts).toHaveLength(3)
  expect(components).toHaveLength(3)

  for (const component of components) {
    const keepoutInGroup = keepouts.find(
      (k) => k.pcb_group_id === component.pcb_group_id,
    )
    expect(keepoutInGroup).toBeDefined()
    if (!keepoutInGroup || keepoutInGroup.shape === "outline") {
      throw new Error("Expected rect or circle keepout with center")
    }
    expect(keepoutInGroup.center.x).toBeCloseTo(component.center.x, 2)
    expect(keepoutInGroup.center.y).toBeCloseTo(component.center.y, 2)
  }

  // Ensure groups other than the origin have actually moved
  const nonOriginComponents = components.filter(
    (c) => c.center.x !== 0 || c.center.y !== 0,
  )
  expect(nonOriginComponents.length).toBeGreaterThan(0)
  for (const comp of nonOriginComponents) {
    const keepoutInGroup = keepouts.find(
      (k) => k.pcb_group_id === comp.pcb_group_id,
    )!
    if (keepoutInGroup.shape === "outline") {
      throw new Error("Expected rect or circle keepout with center")
    }
    expect(keepoutInGroup.center.x).not.toBe(0)
  }
})

test("Keepout with relative offset inside a packed group preserves its offset", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" pcbPack pcbPackGap="2mm" routingDisabled>
      <group name="G1">
        <resistor name="R1" resistance="1k" footprint="1206" />
      </group>
      <group name="G2">
        <resistor name="R2" resistance="1k" footprint="1206" />
        <keepout
          pcbX={2}
          pcbY={1}
          shape="rect"
          width="4mm"
          height="2mm"
          layers={["top"]}
        />
      </group>
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const keepout = circuit.db.pcb_keepout.list()[0]
  if (!keepout || keepout.shape === "outline") {
    throw new Error("Expected rect or circle keepout with center")
  }
  const g2 = circuit.db.pcb_group.list().find((g) => g.name === "G2")!
  const r2 = circuit.db.pcb_component
    .list()
    .find((c) => c.pcb_group_id === g2.pcb_group_id)!

  expect(keepout).toBeDefined()
  expect(keepout.center.x).toBeCloseTo(r2.center.x + 2, 2)
  expect(keepout.center.y).toBeCloseTo(r2.center.y + 1, 2)
})
