import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group keepouts follow the components when the board packs groups", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm" pcbPack pcbPackGap="2mm" routingDisabled>
      <pcbnotetext
        text="GROUP KEEPOUTS FOLLOW RESISTORS"
        pcbY={8}
        fontSize={0.6}
      />
      {["A", "B", "C"].map((suffix, index) => (
        <group key={suffix} name={`G${suffix}`}>
          <resistor name={`R${index + 1}`} resistance="1k" footprint="1206" />
          <keepout
            shape="rect"
            width="6mm"
            height="3mm"
            layers={["top", "bottom"]}
            allowPlacements
            allowTraces
          />
        </group>
      ))}
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const keepouts = circuit.db.pcb_keepout.list()
  expect(keepouts).toHaveLength(3)
  let movedGroups = 0
  for (const [index, suffix] of ["A", "B", "C"].entries()) {
    const pcbGroup = circuit.db.pcb_group.getWhere({ name: `G${suffix}` })!
    const sourceComponent = circuit.db.source_component.getWhere({
      name: `R${index + 1}`,
    })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const keepout = keepouts.find(
      (candidate) => candidate.pcb_group_id === pcbGroup.pcb_group_id,
    )!
    if (keepout.shape !== "rect")
      throw new Error("Expected a rectangular keepout")
    expect(keepout.center.x).toBeCloseTo(pcbComponent.center.x, 5)
    expect(keepout.center.y).toBeCloseTo(pcbComponent.center.y, 5)
    if (Math.hypot(pcbComponent.center.x, pcbComponent.center.y) > 0.1) {
      movedGroups++
    }
  }
  // The regression is invisible if every group stays at its authored origin.
  expect(movedGroups).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
