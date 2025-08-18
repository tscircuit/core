import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Enabling pcbPack in CO2 group should not rotate or move sibling connector group", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="25mm" routingDisabled>
      <group name="CO2" pcbPack>
        <chip name="U5" footprint="soic8" />
        <group name="ADDR_CHAIN">
          <resistor name="R4" resistance="1k" footprint="0402" />
          <solderjumper name="J_0X2A" footprint="solderjumper2_bridged12" pinCount={2} />
          <resistor name="R5" resistance="1k" footprint="0402" />
          <solderjumper name="J_0X2B" footprint="solderjumper2_bridged12" pinCount={2} />
        </group>
      </group>

      <group name="FunctionConnector" pcbX={-15} pcbY={3}>
        <chip name="U2" footprint="soic8" pcbX={8} />
        <silkscreentext text="REF" pcbX={0} pcbY={0} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  // Snapshot for visual debugging
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Assert sibling group's pcb_group center matches props (this currently fails if bug exists)
  const sourceGroup = circuit.db.source_group.list().find((g) => g.name === "FunctionConnector")!
  const pcbGroup = circuit.db.pcb_group.list().find((g) => g.source_group_id === sourceGroup.source_group_id)!
  expect(pcbGroup.center.x).toBeCloseTo(-15, 2)
  expect(pcbGroup.center.y).toBeCloseTo(3, 2)

  // Assert child chip kept relative offset from the group's center
  const u2 = circuit.selectOne("chip.U2") as any
  const u2Pcb = circuit.db.pcb_component.get(u2.pcb_component_id!)!
  expect(Math.abs(u2Pcb.center.x - pcbGroup.center.x)).toBeCloseTo(8, 2)

  // Silkscreen text should not be rotated by a sibling pack
  const silks = circuit.db.silkscreen_text.list().filter((s) => s.text === "REF")
  expect(silks.length).toBe(1)
  expect(silks[0].ccw_rotation ?? 0).toBeCloseTo(0, 2)
})


