import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Reproduction for tscircuit/tscircuit#6066:
 * Keepout inside a packed group is not moved with the group.
 *
 * When groups are packed with `pcbPack`, components like resistors are shifted
 * according to the pack layout, but group-level primitives like `<keepout>`
 * currently remain at the board origin (0, 0).
 */
test("repro: keepout inside packed group does not move with group (#6066)", async () => {
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
  expect(keepouts.length).toBe(3)

  // Resistors have moved to non-zero packed locations
  const r2 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        c.source_component_id === circuit.selectOne(".R2")?.source_component_id,
    )
  const r3 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        c.source_component_id === circuit.selectOne(".R3")?.source_component_id,
    )

  expect(r2?.center.x).toBeGreaterThan(0)
  expect(r3?.center.x).toBeGreaterThan(0)

  // Capture current buggy behavior: all keepouts stay at (0, 0)
  // Expected behavior after fix: each keepout moves with its parent group
  for (const keepout of keepouts) {
    expect(keepout.center.x).toBe(0)
    expect(keepout.center.y).toBe(0)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
