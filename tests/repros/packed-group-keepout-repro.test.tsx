import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout inside a packed group moves with the group", async () => {
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

  circuit.render()

  const pcbComponents = circuit.db.pcb_component.list()
  const pcbKeepouts = circuit.db.pcb_keepout.list()

  expect(pcbKeepouts).toHaveLength(3)
  for (const keepout of pcbKeepouts) {
    const resistor = pcbComponents.find(
      (c) => c.pcb_group_id === keepout.pcb_group_id,
    )!
    if (keepout.shape !== "outline") {
      expect(keepout.center.x).toBeCloseTo(resistor.center.x, 3)
      expect(keepout.center.y).toBeCloseTo(resistor.center.y, 3)
    }
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
