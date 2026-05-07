import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: setting `layer="bottom"` on a parent <group> must
// cascade to the group's component children — they should land on
// the back layer of the board. Previously the prop was consumed by
// the group itself but never inherited; child components stayed on
// `layer: "top"` regardless of the wrapping group's layer flag, so
// any user trying to flip a sub-region of their schematic to the
// back side had to put `layer="bottom"` on every component manually.

test("layer='bottom' on a <group> cascades to its component children", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group pcbX={0} pcbY={0} layer="bottom">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
        <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={2} pcbY={0} />
      </group>
    </board>,
  )

  circuit.render()

  const r1 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name === "R1",
    )
  const c1 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name === "C1",
    )

  expect(r1?.layer).toBe("bottom")
  expect(c1?.layer).toBe("bottom")

  // Pads of the inherited-bottom components must also be on the back
  // copper layer — the auto-renderer should not split layer between
  // chip and pads.
  const r1Pads = circuit.db.pcb_smtpad
    .list()
    .filter((p) => p.pcb_component_id === r1?.pcb_component_id)
  expect(r1Pads.length).toBeGreaterThan(0)
  for (const p of r1Pads) expect(p.layer).toBe("bottom")
})

test("explicit child layer wins over inherited group layer", async () => {
  // A child setting `layer="top"` inside a `<group layer="bottom">`
  // should remain on top — explicit child intent overrides inherited
  // default.
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group pcbX={0} pcbY={0} layer="bottom">
        <resistor
          name="R_TOP"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
          layer="top"
        />
        <resistor
          name="R_INHERIT"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={0}
        />
      </group>
    </board>,
  )

  circuit.render()

  const rTop = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name ===
        "R_TOP",
    )
  const rInherit = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name ===
        "R_INHERIT",
    )

  expect(rTop?.layer).toBe("top")
  expect(rInherit?.layer).toBe("bottom")
})

test("no layer anywhere defaults to 'top' (regression)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      </group>
    </board>,
  )

  circuit.render()

  const r1 = circuit.db.pcb_component.list()[0]
  expect(r1?.layer).toBe("top")
})
