import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: an inner group without its own width/height,
// nested in a `<board width=... height=...>`, had no bounds passed
// to the packer. Components in the group (especially small
// siblings competing for placement near the anchor) packed in an
// unbounded column going far off the board's bottom edge — large
// chips ended up dozens of mm out of bounds.
//
// Fix: inherit bounds from the nearest ancestor with width/height
// when the packed group itself doesn't specify them. See
// tscircuit/core#2272.

test("inner group inherits bounds from its board ancestor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="14mm">
      <group name="region_mcu" pcbX={-18} pcbY={0}>
        <chip
          name="U_BIG"
          pinLabels={{ pin1: ["A"] }}
          footprint={
            <footprint>
              {/* 12x12 mm pad cluster — one large rect pad as a stand-in
                  for the InsightSiP module's footprint. */}
              <smtpad
                shape="rect"
                width="12mm"
                height="12mm"
                pcbX="0mm"
                pcbY="0mm"
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
        <capacitor name="C2" capacitance="100nF" footprint="0402" />
        <capacitor name="C3" capacitance="100nF" footprint="0402" />
        <capacitor name="C4" capacitance="100nF" footprint="0402" />
        <resistor name="R1" resistance="10k" footprint="0402" />
        <resistor name="R2" resistance="10k" footprint="0402" />
        <resistor name="R3" resistance="10k" footprint="0402" />
        <resistor name="R4" resistance="4.7k" footprint="0402" />
        <resistor name="R5" resistance="4.7k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  // Every component should land within the board: X in [-25, +25],
  // Y in [-7, +7]. Before the fix, the small caps + resistors
  // packed in an unbounded column going down to Y=-22 (off-board).
  for (const pcbComp of circuit.db.pcb_component.list()) {
    const sc = circuit.db.source_component.get(pcbComp.source_component_id)
    expect(pcbComp.center.x).toBeGreaterThanOrEqual(-25)
    expect(pcbComp.center.x).toBeLessThanOrEqual(25)
    // Allow a tiny tolerance on the Y assertion — the small parts
    // get packed snugly on the inside of the board edge.
    expect(pcbComp.center.y, `${sc?.name} y out of bounds`).toBeGreaterThanOrEqual(-7)
    expect(pcbComp.center.y, `${sc?.name} y out of bounds`).toBeLessThanOrEqual(7)
  }
})
