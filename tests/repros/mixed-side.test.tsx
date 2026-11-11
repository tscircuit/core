import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mixed-side connector pads and plated slot follow the footprint mounting side", async () => {
  const { circuit } = getTestFixture()
  const mounts = (["top", "bottom"] as const).flatMap((layer, row) =>
    [0, 90, 180, 270, 30].map((rotation, column) => ({
      layer,
      rotation,
      x: (column - 2) * 8,
      y: 4 - row * 8,
    })),
  )
  circuit.add(
    <board width={42} height={19} routingDisabled schematicDisabled>
      <pcbnotetext
        pcbY={8.55}
        fontSize={1.32}
        color="#8de2b3"
        text="Fix - one pad on each face"
      />
      <pcbnotetext
        pcbY={-8.68}
        fontSize={1.08}
        color="#f2f4f7"
        text="Bottom 30 deg - slot aligns at 20 deg"
      />
      {mounts.map(({ layer, rotation, x, y }, index) => (
        <Fragment key={`${layer}-${rotation}`}>
          <chip
            name={`J${index + 1}`}
            layer={layer}
            pcbX={x}
            pcbY={y}
            pcbRotation={rotation}
            pinLabels={{ 1: "CONTACT", 2: "LATCH" }}
            footprint={
              <footprint originalLayer="top">
                <smtpad
                  portHints={["pin1"]}
                  layer="top"
                  shape="rect"
                  pcbX={-2}
                  pcbY={-0.352654}
                  width={1.5}
                  height={1}
                />
                <smtpad
                  portHints={["pin2"]}
                  layer="bottom"
                  shape="rect"
                  pcbX={2}
                  pcbY={0.352654}
                  width={1.5}
                  height={1}
                />
                <platedhole
                  shape="pill"
                  pcbY={2}
                  outerWidth={3.1}
                  outerHeight={1.1}
                  holeWidth={2.3}
                  holeHeight={0.7}
                  pcbRotation={10}
                />
              </footprint>
            }
          />
          <pcbnotetext
            pcbX={x}
            pcbY={y - 3.1}
            text={rotation === 0 ? `${layer} 0 deg` : `${rotation} deg`}
            color="#c5d4e2"
            fontSize={0.82}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  const slotAxes = circuit.db.pcb_plated_hole.list().map((hole) => {
    if (hole.shape !== "pill") throw new Error("Expected plated slot")
    return Math.round((hole.ccw_rotation ?? 0) % 180)
  })
  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(mounts.length * 2)
  expect(slotAxes).toHaveLength(mounts.length)
  for (const [index, { layer }] of mounts.entries()) {
    const contact = pads[index * 2]!
    const latch = pads[index * 2 + 1]!
    if (!("x" in contact) || !("x" in latch))
      throw new Error("Expected the two rectangular connector pads")
    expect([contact.layer, latch.layer]).toEqual([
      layer,
      layer === "top" ? "bottom" : "top",
    ])
    // The pad centers mark a line parallel to the physical slot in board-world XY.
    const axis =
      (Math.atan2(latch.y - contact.y, latch.x - contact.x) * 180) / Math.PI
    expect(slotAxes[index]).toBe(Math.round((axis + 180) % 180))
  }
  for (const pad of circuit.db.pcb_smtpad.list()) {
    expect(circuit.db.pcb_port.get(pad.pcb_port_id!)?.layers).toEqual([
      pad.layer,
    ])
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
