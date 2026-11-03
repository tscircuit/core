import { expect, test } from "bun:test"
import { Circuit } from "lib"

test("panel tab routing mouse bites leave drillable webs between holes (#5066)", async () => {
  const circuit = new Circuit()
  const B = () => (
    <board width="14mm" height="18mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </board>
  )

  circuit.add(
    <panel
      layoutMode="grid"
      row={3}
      col={3}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabLength="3mm"
    >
      {["b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"].map((id) => (
        <B key={id} />
      ))}
    </panel>,
  )

  await circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const holes = circuitJson.filter(
    (e) =>
      e.type === "pcb_hole" &&
      (e as any).pcb_hole_id?.startsWith("panel_mouse_bite"),
  ) as any[]

  expect(holes.length).toBeGreaterThan(0)
  expect(holes.length).toBe(108) // 9 boards * 4 edges * 3 holes = 108 holes

  // Check web between adjacent holes
  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      const h1 = holes[i]!
      const h2 = holes[j]!
      const dist = Math.hypot(h1.x - h2.x, h1.y - h2.y)
      // If holes belong to the same tab (distance less than tabLength)
      if (dist < 2.0 && dist > 0.001) {
        const web = dist - h1.hole_diameter
        // Web must be safe and drillable (>= 0.25 mm), not the former 0.063 mm
        expect(web).toBeGreaterThan(0.25)
      }
    }
  }
})
