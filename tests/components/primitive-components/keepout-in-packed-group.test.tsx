import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Keepout inside a packed group moves with the group", () => {
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
          shape="circle"
          radius="2mm"
          pcbX={1}
          pcbY={-0.5}
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

  const circuitJson = circuit.getCircuitJson()
  const sourceGroups = circuitJson.filter((el) => el.type === "source_group")
  const pcbGroups = circuitJson.filter((el) => el.type === "pcb_group")
  const pcbComponents = circuitJson.filter((el) => el.type === "pcb_component")
  const pcbKeepouts = circuitJson.filter((el) => el.type === "pcb_keepout")

  expect(pcbKeepouts).toHaveLength(3)

  const findGroupForName = (name: string) => {
    const sg = sourceGroups.find((el) => el.name === name)
    return pcbGroups.find((pg) => pg.source_group_id === sg?.source_group_id)
  }

  const groupA = findGroupForName("GA")!
  const groupB = findGroupForName("GB")!
  const groupC = findGroupForName("GC")!

  const keepoutA = pcbKeepouts.find(
    (k) => k.pcb_group_id === groupA.pcb_group_id,
  )!
  const keepoutB = pcbKeepouts.find(
    (k) => k.pcb_group_id === groupB.pcb_group_id,
  )!
  const keepoutC = pcbKeepouts.find(
    (k) => k.pcb_group_id === groupC.pcb_group_id,
  )!

  const r1 = pcbComponents.find((c) => c.pcb_group_id === groupA.pcb_group_id)!
  const r2 = pcbComponents.find((c) => c.pcb_group_id === groupB.pcb_group_id)!

  expect(keepoutA.shape).toBe("rect")
  expect(keepoutB.shape).toBe("rect")
  expect(keepoutC.shape).toBe("circle")

  if (keepoutA.shape === "rect") {
    expect(keepoutA.center.x).toBeCloseTo(r1.center.x, 3)
    expect(keepoutA.center.y).toBeCloseTo(r1.center.y, 3)
  }
  if (keepoutB.shape === "rect") {
    expect(keepoutB.center.x).toBeCloseTo(r2.center.x, 3)
    expect(keepoutB.center.y).toBeCloseTo(r2.center.y, 3)
    expect(Math.abs(keepoutB.center.x)).toBeGreaterThan(1)
  }
  if (keepoutC.shape === "circle") {
    const distToGroupC = Math.hypot(
      keepoutC.center.x - groupC.center.x,
      keepoutC.center.y - groupC.center.y,
    )
    expect(distToGroupC).toBeCloseTo(Math.hypot(1, -0.5), 3)
    expect(Math.abs(keepoutC.center.x)).toBeGreaterThan(1)
  }
})
