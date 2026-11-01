import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Reproduction & Fix for tscircuit/tscircuit#6066:
 * Keepout inside a packed group is moved with the group.
 *
 * When groups are packed with `pcbPack`, child components and group-level
 * primitives like `<keepout>` must be transformed by the pack solver output,
 * ensuring keepouts remain centered with their respective group components.
 */
test("keepout inside packed group is moved with the group (#6066)", async () => {
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

  const r1 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        c.source_component_id === circuit.selectOne(".R1")?.source_component_id,
    )
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

  expect(r1).toBeDefined()
  expect(r2).toBeDefined()
  expect(r3).toBeDefined()

  expect(r2!.center.x).toBeGreaterThan(0)
  expect(r3!.center.x).toBeGreaterThan(0)

  // Each keepout must match the center coordinates of the resistor in its group
  const keepoutGA = keepouts.find(
    (k) => k.shape === "rect" && k.pcb_group_id === r1!.pcb_group_id,
  )
  const keepoutGB = keepouts.find(
    (k) => k.shape === "rect" && k.pcb_group_id === r2!.pcb_group_id,
  )
  const keepoutGC = keepouts.find(
    (k) => k.shape === "rect" && k.pcb_group_id === r3!.pcb_group_id,
  )

  expect(keepoutGA).toBeDefined()
  expect(keepoutGB).toBeDefined()
  expect(keepoutGC).toBeDefined()

  if (
    keepoutGA &&
    keepoutGB &&
    keepoutGC &&
    "center" in keepoutGA &&
    "center" in keepoutGB &&
    "center" in keepoutGC
  ) {
    expect(keepoutGA.center.x).toBeCloseTo(r1!.center.x, 2)
    expect(keepoutGA.center.y).toBeCloseTo(r1!.center.y, 2)

    expect(keepoutGB.center.x).toBeCloseTo(r2!.center.x, 2)
    expect(keepoutGB.center.y).toBeCloseTo(r2!.center.y, 2)

    expect(keepoutGC.center.x).toBeCloseTo(r3!.center.x, 2)
    expect(keepoutGC.center.y).toBeCloseTo(r3!.center.y, 2)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
