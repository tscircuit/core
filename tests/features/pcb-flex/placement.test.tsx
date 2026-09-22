import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Off-origin points distinguish swapped axes, wrong rotation order, and failure
// to subtract the board center. Coordinates are flat PCB mm (+Z above).
test("flex primitives resolve rotated groups and local stiffener placement into board coordinates", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      pcbX={30}
      pcbY={-10}
      width={30}
      height={20}
      material="flex"
      thickness={0.15}
      schematicDisabled
      routingDisabled
    >
      <group pcbX={3} pcbY={4} pcbRotation={90}>
        <pcbbend
          name="B1"
          x1="1mm"
          y1="2mm"
          x2="4mm"
          y2="2mm"
          bendAngle="-90deg"
          bendRadius="2mm"
          bendSide="left"
        />
        <pcbstiffener
          name="rect"
          shape="rect"
          pcbX={2}
          pcbY={1}
          pcbRotation={30}
          width={4}
          height={2}
          layer="top"
          material="stainless_steel"
          thickness="0.3mm"
        />
        <pcbstiffener
          name="polygon"
          shape="polygon"
          pcbX={-2}
          pcbY={-1}
          pcbRotation={90}
          outline={[
            { x: 1, y: 0 },
            { x: 3, y: 0 },
            { x: 1, y: 2 },
          ]}
          layer="bottom"
          material="polyimide"
          thickness="0.1mm"
          adhesiveThickness={0}
        />
      </group>
      <pcbnotetext text="Rotated reinforcements" pcbY={-7} fontSize={1} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const bend = circuit.db.pcb_bend.list()[0]
  expect(bend.start.x).toBeCloseTo(1)
  expect(bend.start.y).toBeCloseTo(5)
  expect(bend.end.x).toBeCloseTo(1)
  expect(bend.end.y).toBeCloseTo(8)
  expect(bend).toMatchObject({
    bend_angle: -90,
    bend_radius: 2,
    bend_side: "left",
  })
  const rect = circuit.db.pcb_stiffener.list().find((s) => s.name === "rect")!
  if (rect.shape !== "rect") throw new Error("Expected rectangular stiffener")
  expect(rect.center.x).toBeCloseTo(2)
  expect(rect.center.y).toBeCloseTo(6)
  expect(rect.rotation).toBeCloseTo(120)
  expect(rect.adhesive_thickness).toBeUndefined()
  const polygon = circuit.db.pcb_stiffener
    .list()
    .find((s) => s.name === "polygon")!
  if (polygon.shape !== "polygon") throw new Error("Expected polygon stiffener")
  for (const [i, expected] of [
    { x: 3, y: 2 },
    { x: 1, y: 2 },
    { x: 3, y: 0 },
  ].entries()) {
    expect(polygon.outline[i].x).toBeCloseTo(expected.x)
    expect(polygon.outline[i].y).toBeCloseTo(expected.y)
  }
  expect(polygon.adhesive_thickness).toBe(0)
  expect(bend.pcb_group_id).toBe(rect.pcb_group_id)
  expect(bend.subcircuit_id).toBe(rect.subcircuit_id)
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    poppygl: {
      width: 700,
      height: 500,
      camPos: [-5, 45, 30],
      lookAt: [-30, 0, -10],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
      grid: undefined,
    },
  })
})
