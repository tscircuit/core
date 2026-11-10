import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points in right-handed mm: +X right, +Y top, +Z above.
// The two holes are separated; the SMD copper must connect them to one port.
const thermalPadPlacement = { pcbX: 0.5, pcbY: -0.25, portHints: ["1"] }

const thermalPadShapes = [
  {
    name: "rect",
    pad: <smtpad {...thermalPadPlacement} shape="rect" width={4} height={3} />,
  },
  {
    name: "circle",
    pad: <smtpad {...thermalPadPlacement} shape="circle" radius={2} />,
  },
  {
    name: "pill",
    pad: (
      <smtpad
        {...thermalPadPlacement}
        shape="pill"
        width={4}
        height={3}
        radius={1.5}
      />
    ),
  },
  {
    name: "rotated_rect",
    pad: (
      <smtpad
        {...thermalPadPlacement}
        shape="rotated_rect"
        width={4}
        height={3}
        ccwRotation={45}
      />
    ),
  },
  {
    name: "rotated_pill",
    pad: (
      <smtpad
        {...thermalPadPlacement}
        shape="rotated_pill"
        width={4}
        height={3}
        ccwRotation={45}
        radius={1.5}
      />
    ),
  },
  {
    name: "polygon",
    pad: (
      <smtpad
        {...thermalPadPlacement}
        shape="polygon"
        points={[
          { x: -2, y: -1.5 },
          { x: 2, y: -1.5 },
          { x: 2, y: 1.5 },
          { x: -2, y: 1.5 },
        ]}
      />
    ),
  },
]

/** All placements below are board-world points in right-handed mm:
 * +X right, +Y top, +Z above. Core applies each chip's rotation and layer flip.
 */
test("thermal holes share each SMD shape's port across rotations and layers", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={112} height={54} routingDisabled schematicDisabled>
      {thermalPadShapes.flatMap(({ name, pad }, row) =>
        (["top", "bottom"] as const).flatMap((layer, side) =>
          [0, 45, 90, 180, 270].map((rotation, column) => (
            <Fragment key={`${name}_${layer}_${rotation}`}>
              <chip
                name={`${name}_${layer}_${rotation}`}
                pcbX={(column + side * 5) * 11 - 49.5}
                pcbY={20 - row * 8}
                pcbRotation={rotation}
                layer={layer}
                pinLabels={{ pin1: ["GND_EP", "THERMAL"] }}
                footprint={
                  <footprint>
                    {pad}
                    <platedhole
                      portHints={["1"]}
                      pcbX={0.5}
                      pcbY={0.35}
                      shape="circle"
                      outerDiameter={0.5}
                      holeDiameter={0.3}
                    />
                    <platedhole
                      portHints={["1"]}
                      pcbX={0.5}
                      pcbY={-0.85}
                      shape="circle"
                      outerDiameter={0.5}
                      holeDiameter={0.3}
                    />
                  </footprint>
                }
                noSchematicRepresentation
              />
              <pcbnotetext
                pcbX={(column + side * 5) * 11 - 49.5}
                pcbY={16.5 - row * 8}
                fontSize={0.45}
                text={`${name} ${layer} ${rotation}deg`}
              />
            </Fragment>
          )),
        ),
      )}
      <pcbnotetext
        pcbY={25}
        fontSize={0.7}
        text="Each SMD pad and its two separated thermal holes must share one GND_EP port"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.source_ambiguous_port_reference.list()).toEqual([])
  expect(circuit.db.pcb_pad_pad_clearance_error.list()).toEqual([])
  for (const chip of circuit.db.pcb_component.list()) {
    const pad = circuit.db.pcb_smtpad.getWhere({
      pcb_component_id: chip.pcb_component_id,
    })!
    const holes = circuit.db.pcb_plated_hole.list({
      pcb_component_id: chip.pcb_component_id,
    })
    expect(pad.pcb_port_id).toBeDefined()
    expect(holes).toHaveLength(2)
    for (const hole of holes) expect(hole.pcb_port_id).toBe(pad.pcb_port_id)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
