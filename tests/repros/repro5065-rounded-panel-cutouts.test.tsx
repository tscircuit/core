import { expect, test } from "bun:test"
import { Circuit } from "lib"

test("panel tab routing around board with borderRadius does not create tiny invalid cutouts (#5065)", async () => {
  const circuit = new Circuit()
  const B = () => (
    <board width="14mm" height="18mm" borderRadius="2mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </board>
  )

  circuit.add(
    <panel
      layoutMode="grid"
      row={2}
      col={2}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabLength="3mm"
    >
      <B />
      <B />
      <B />
      <B />
    </panel>,
  )

  await circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const cutouts = circuitJson.filter((e) => e.type === "pcb_cutout")

  // Should have continuous slots, not hundreds of zero-width cutouts
  expect(cutouts.length).toBeLessThan(100)
  expect(cutouts.length).toBe(16) // 4 slots per board x 4 boards = 16 continuous slots

  // No cutouts should be tiny slivers
  for (const cutout of cutouts) {
    if (cutout.shape === "rect") {
      expect(cutout.width).toBeGreaterThan(0.5)
    }
  }
})
