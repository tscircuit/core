import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout inside a packed group moves with the group (#6066)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" pcbPack pcbPackGap="2mm" routingDisabled>
      <pcbnotetext
        text="PACKED GROUPS GA, GB, GC KEEP THEIR KEEPOUTS CENTERED"
        pcbY={8}
        fontSize={0.7}
      />
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

  const pcbComponents = circuit.db.pcb_component.list()
  const pcbKeepouts = circuit.db.pcb_keepout.list()
  expect(pcbComponents).toHaveLength(3)
  expect(pcbKeepouts).toHaveLength(3)

  for (const keepout of pcbKeepouts) {
    const groupComp = pcbComponents.find(
      (c) => c.pcb_group_id === keepout.pcb_group_id,
    )
    expect(groupComp).toBeDefined()
    expect(keepout.shape).toBe("rect")
    if (keepout.shape !== "outline") {
      expect(keepout.center.x).toBeCloseTo(groupComp!.center.x, 3)
      expect(keepout.center.y).toBeCloseTo(groupComp!.center.y, 3)
    }
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
