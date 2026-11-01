import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepouts inside packed groups move with their parent groups", async () => {
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

  const pcbComponents = circuit.db.pcb_component.list()
  const pcbKeepouts = circuit.db.pcb_keepout.list()
  expect(pcbComponents).toHaveLength(3)
  expect(pcbKeepouts).toHaveLength(3)

  for (const pcbComponent of pcbComponents) {
    const matchingKeepout = pcbKeepouts.find(
      (k) => k.pcb_group_id === pcbComponent.pcb_group_id,
    )
    expect(matchingKeepout).toBeDefined()
    if (matchingKeepout && matchingKeepout.shape !== "outline") {
      expect(matchingKeepout.center.x).toBeCloseTo(pcbComponent.center.x, 5)
      expect(matchingKeepout.center.y).toBeCloseTo(pcbComponent.center.y, 5)
    }
  }
})
