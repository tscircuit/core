import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit courtyard shapes follow pad transforms on both PCB layers", async () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270]
  const layers = ["top", "bottom"] as const
  circuit.add(
    <board width={26} height={14} routingDisabled>
      {layers.flatMap((layer, row) =>
        rotations.map((rotation, column) => (
          <capacitor
            key={`${layer}_${rotation}`}
            name={`C${row}${column}`}
            capacitance="100nF"
            footprint="cap0402"
            pcbX={column * 6 - 9}
            pcbY={row === 0 ? 3 : -3}
            pcbRotation={rotation}
            layer={layer}
          >
            {/* Center every explicit shape on pin2, away from the default center. */}
            <courtyardrect pcbX={0.51} width={1.66} height={0.74} />
            <courtyardcircle pcbX={0.51} radius={1} />
            <courtyardoutline
              outline={[
                { x: -0.32, y: -0.37 },
                { x: 1.34, y: -0.37 },
                { x: 1.34, y: 0.37 },
                { x: -0.32, y: 0.37 },
              ]}
            />
          </capacitor>
        )),
      )}
      <pcbnotetext
        pcbY={6}
        text="Top: 0 / 90 / 180 / 270 degrees; courtyards centered on pin2"
        fontSize={0.5}
      />
      <pcbnotetext
        pcbY={-6}
        text="Bottom: 0 / 90 / 180 / 270 degrees; same explicit shapes"
        fontSize={0.5}
      />
    </board>,
  )
  circuit.render()

  const rects = circuit.db.pcb_courtyard_rect.list()
  expect(rects).toHaveLength(8)
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(8)
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(8)
  for (const capacitor of circuit.selectAll("capacitor")) {
    const partId = capacitor.pcb_component_id!
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "rect")
      .filter((pad) => pad.pcb_component_id === partId)
    expect(pads).toHaveLength(2)
    const pin2 = pads.find(
      (pad) =>
        pad.port_hints?.includes("2") || pad.port_hints?.includes("pin2"),
    )!
    const pin1 = pads.find((pad) => pad !== pin2)!
    const rect = rects.find((rect) => rect.pcb_component_id === partId)!
    const circle = circuit.db.pcb_courtyard_circle
      .list()
      .find((circle) => circle.pcb_component_id === partId)!
    const outline = circuit.db.pcb_courtyard_outline
      .list()
      .find((outline) => outline.pcb_component_id === partId)!
    const outlineCenter = {
      x:
        outline.outline.reduce((sum, point) => sum + point.x, 0) /
        outline.outline.length,
      y:
        outline.outline.reduce((sum, point) => sum + point.y, 0) /
        outline.outline.length,
    }
    for (const center of [rect.center, circle.center, outlineCenter]) {
      expect(center.x).toBeCloseTo(pin2.x)
      expect(center.y).toBeCloseTo(pin2.y)
    }
    expect(pin2.layer).toBe(rect.layer)
    expect(pin2.layer).toBe(circle.layer)
    expect(pin2.layer).toBe(outline.layer)
    const padAxisDegrees =
      ((Math.atan2(pin2.y - pin1.y, pin2.x - pin1.x) * 180) / Math.PI + 360) %
      180
    expect((rect.ccw_rotation ?? 0) % 180).toBeCloseTo(padAxisDegrees)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
