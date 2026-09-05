import { expect, test } from "bun:test"
import { SolderPaste } from "lib/components/primitive-components/SolderPaste"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("paste apertures follow emitted footprint geometry on both board sides", () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const pcbRotation of [0, 90, 180, 270, 37]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <board width={50} height={50} routingDisabled>
          <chip
            name="U1"
            layer={layer}
            pcbX={7}
            pcbY={11}
            pcbRotation={pcbRotation}
            footprint={
              <footprint>
                <smtpad
                  shape="polygon"
                  pcbX={2}
                  pcbY={3}
                  points={[
                    { x: -2, y: -1 },
                    { x: 2, y: -1 },
                    { x: 2, y: 1 },
                    { x: -2, y: 1 },
                  ]}
                />
                <solderpaste
                  shape="rect"
                  width={4}
                  height={2}
                  pcbX={2}
                  pcbY={3}
                />
                <smtpad
                  shape="circle"
                  radius={0.5}
                  pcbX={-3}
                  pcbY={2}
                  solderPasteMargin={-0.5}
                />
                <solderpaste shape="circle" radius={0.5} pcbX={-3} pcbY={2} />
              </footprint>
            }
          />
        </board>,
      )
      circuit.render()
      const polygon = circuit.db.pcb_smtpad
        .list()
        .find((pad) => pad.shape === "polygon")!
      const copperCircle = circuit.db.pcb_smtpad
        .list()
        .find((pad) => pad.shape === "circle")!
      const apertures = circuit.db.pcb_solder_paste.list()
      expect(apertures).toHaveLength(2)
      const rect = apertures.find((paste) => paste.shape !== "circle")!
      const circle = apertures.find((paste) => paste.shape === "circle")!
      expect(rect.layer).toBe(layer)
      expect(circle).toMatchObject({
        x: copperCircle.x,
        y: copperCircle.y,
        radius: 0.5,
        layer,
      })
      if (rect.shape !== "rect" && rect.shape !== "rotated_rect")
        throw new Error("Expected rectangular paste")
      if (polygon.shape !== "polygon")
        throw new Error("Expected polygon copper")

      // Compare the emitted aperture perimeter to independently emitted copper
      // vertices, so a wrong mirror or rotation cannot pass by checking only size.
      const angle =
        rect.shape === "rotated_rect" ? (rect.ccw_rotation * Math.PI) / 180 : 0
      for (const dx of [-rect.width / 2, rect.width / 2]) {
        for (const dy of [-rect.height / 2, rect.height / 2]) {
          const x = rect.x + dx * Math.cos(angle) - dy * Math.sin(angle)
          const y = rect.y + dx * Math.sin(angle) + dy * Math.cos(angle)
          expect(
            polygon.points.some(
              (point) => Math.hypot(point.x - x, point.y - y) < 1e-8,
            ),
          ).toBe(true)
        }
      }
      const pastePrimitive = circuit.selectAll("solderpaste")[0] as SolderPaste
      const bounds = pastePrimitive._getPcbCircuitJsonBounds()
      expect(bounds.bounds.left).toBeCloseTo(
        Math.min(...polygon.points.map((p) => p.x)),
      )
      expect(bounds.bounds.right).toBeCloseTo(
        Math.max(...polygon.points.map((p) => p.x)),
      )
      expect(bounds.bounds.top).toBeCloseTo(
        Math.max(...polygon.points.map((p) => p.y)),
      )
      expect(bounds.bounds.bottom).toBeCloseTo(
        Math.min(...polygon.points.map((p) => p.y)),
      )
      const oldX = rect.x
      const oldY = rect.y
      pastePrimitive._moveCircuitJsonElements({ deltaX: 4, deltaY: -2 })
      const moved = circuit.db.pcb_solder_paste.get(rect.pcb_solder_paste_id)!
      expect(moved.x).toBeCloseTo(oldX + 4)
      expect(moved.y).toBeCloseTo(oldY - 2)
      expect(circuit.db.pcb_solder_paste.list()).toHaveLength(2)
    }
  }
})
