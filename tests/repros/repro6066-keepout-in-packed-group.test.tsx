import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro6066: keepout inside a packed group is moved with the group", async () => {
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

  const pcbKeepouts = circuit.db.pcb_keepout.list()
  const pcbComponents = circuit.db.pcb_component.list()
  const pcbGroups = circuit.db.pcb_group.list()

  expect(pcbKeepouts).toHaveLength(3)
  expect(pcbComponents).toHaveLength(3)

  for (const groupName of ["GA", "GB", "GC"]) {
    const pcbGroup = pcbGroups.find((g) => g.name === groupName)!
    expect(pcbGroup).toBeDefined()

    const keepout = pcbKeepouts.find(
      (k) => k.pcb_group_id === pcbGroup.pcb_group_id,
    )!
    expect(keepout).toBeDefined()

    const groupComponent = pcbComponents.find(
      (c) => c.pcb_group_id === pcbGroup.pcb_group_id,
    )!
    expect(groupComponent).toBeDefined()

    expect("center" in keepout).toBe(true)
    if ("center" in keepout) {
      expect(keepout.center.x).toBeCloseTo(groupComponent.center.x, 5)
      expect(keepout.center.y).toBeCloseTo(groupComponent.center.y, 5)
    }
  }
})
