import { expect, test } from "bun:test"
import { pcb_hole } from "circuit-json"
import { Fragment } from "react"
import { applyToPoint, rotateDEG } from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pill slots and their bounds follow emitted reference pads through parent transforms on both layers", async () => {
  const placements = [
    { group: 0, component: 0, nestedGroup: 0, hole: 0 },
    { group: 0, component: 90, nestedGroup: 0, hole: 0 },
    { group: 0, component: 180, nestedGroup: 0, hole: 0 },
    { group: 0, component: 270, nestedGroup: 0, hole: 0 },
    { group: 0, component: 45, nestedGroup: 0, hole: 0 },
    { group: 11, component: 30, nestedGroup: 17, hole: 23 },
    { group: 0, component: 90, nestedGroup: 90, hole: 180 },
    { group: 0, component: -90, nestedGroup: 0, hole: -37 },
  ]

  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    const slots = placements.flatMap((placement) =>
      [false, true].map((vertical) => ({ placement, vertical })),
    )
    circuit.add(
      <board width={70} height={70} routingDisabled schematicDisabled>
        <pcbnotetext
          text={`${layer}: slots must align with their reference pads`}
          pcbY={33}
          fontSize={1}
        />
        {slots.map(({ placement, vertical }, index) => {
          const x = (index % 4) * 16 - 24
          const y = 24 - Math.floor(index / 4) * 16
          // Reference pads are outside the slot on its authored major axis.
          // Their emitted world positions are the orientation oracle below.
          const referencePads = [-3, 3].map((offset) =>
            applyToPoint(
              rotateDEG(placement.hole),
              vertical ? { x: 0, y: offset } : { x: offset, y: 0 },
            ),
          )
          return (
            <group key={index} pcbX={x} pcbY={y} pcbRotation={placement.group}>
              <group pcbRotation={placement.nestedGroup}>
                <chip
                  name={`U${index + 1}`}
                  pcbX={0}
                  pcbY={0}
                  pcbRotation={placement.component}
                  layer={layer}
                  footprint={
                    <footprint originalLayer="top">
                      {referencePads.map((point, pin) => (
                        <Fragment key={pin}>
                          <smtpad
                            shape="circle"
                            radius={0.2}
                            pcbX={point.x + 0.8}
                            pcbY={point.y - 0.6}
                            portHints={[`pin${pin + 1}`]}
                          />
                        </Fragment>
                      ))}
                      <hole
                        name={`H${index + 1}`}
                        shape="pill"
                        width={vertical ? 1.2 : 4.2}
                        height={vertical ? 4.2 : 1.2}
                        pcbX={0.8}
                        pcbY={-0.6}
                        pcbRotation={placement.hole}
                      />
                    </footprint>
                  }
                />
              </group>
              <pcbnotetext
                text={`U${index + 1} ${layer} ${vertical ? "vertical" : "horizontal"}`}
                pcbY={-5}
                fontSize={0.8}
              />
            </group>
          )
        })}
      </board>,
    )
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_hole.list()).toHaveLength(slots.length)
    for (const [index, { vertical }] of slots.entries()) {
      const source = circuit.db.source_component.getWhere({
        name: `U${index + 1}`,
      })!
      const component = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      const hole = circuit.db.pcb_hole.getWhere({
        pcb_component_id: component.pcb_component_id,
      })!
      if (hole.hole_shape !== "pill" && hole.hole_shape !== "rotated_pill") {
        throw new Error("Expected pill slot geometry")
      }
      const pads = circuit.db.pcb_smtpad
        .list({ pcb_component_id: component.pcb_component_id })
        .filter((pad) => pad.shape === "circle")
      expect(pads).toHaveLength(2)
      const first = pads[0]!
      const second = pads[1]!
      const separation = Math.hypot(second.x - first.x, second.y - first.y)
      const axis = {
        x: (second.x - first.x) / separation,
        y: (second.y - first.y) / separation,
      }
      const slotAxis = applyToPoint(
        rotateDEG(hole.hole_shape === "rotated_pill" ? hole.ccw_rotation : 0),
        vertical ? { x: 0, y: 1 } : { x: 1, y: 0 },
      )

      expect(hole.x).toBeCloseTo((first.x + second.x) / 2, 7)
      expect(hole.y).toBeCloseTo((first.y + second.y) / 2, 7)
      // A slot axis is unoriented: either endpoint ordering represents the same drill.
      expect(Math.abs(slotAxis.x * axis.y - slotAxis.y * axis.x)).toBeLessThan(
        1e-7,
      )
      expect(hole.hole_width).toBe(vertical ? 1.2 : 4.2)
      expect(hole.hole_height).toBe(vertical ? 4.2 : 1.2)
      expect(pcb_hole.safeParse(hole).success).toBe(true)

      const primitive = circuit.selectOne(`.H${index + 1}`)!
      const bounds = primitive._getPcbCircuitJsonBounds()
      const expectedWidth = 4.2 * Math.abs(axis.x) + 1.2 * Math.abs(axis.y)
      const expectedHeight = 4.2 * Math.abs(axis.y) + 1.2 * Math.abs(axis.x)
      expect(bounds.width).toBeCloseTo(expectedWidth, 7)
      expect(bounds.height).toBeCloseTo(expectedHeight, 7)
      expect(bounds.bounds.left).toBeCloseTo(hole.x - expectedWidth / 2, 7)
      expect(bounds.bounds.right).toBeCloseTo(hole.x + expectedWidth / 2, 7)
      expect(bounds.bounds.top).toBeCloseTo(hole.y + expectedHeight / 2, 7)
      expect(bounds.bounds.bottom).toBeCloseTo(hole.y - expectedHeight / 2, 7)
    }
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      {
        showPcbNotes: true,
        width: 1000,
        height: 1000,
      },
    )
  }
})
