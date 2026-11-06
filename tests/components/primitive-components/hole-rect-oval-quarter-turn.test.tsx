import { expect, test } from "bun:test"
import { Fragment } from "react"
import { Hole } from "lib/components/primitive-components/Hole"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular and oval mounting holes follow their emitted pad guides at quarter turns", async () => {
  // Footprint-local points in mm: +X right, +Y up, +Z above, right-handed.
  // Translated board/group placements produce board-world points. Each pad is
  // 0.2mm larger on every side; its emitted geometry is the independent guide.
  const { circuit } = getTestFixture()
  const cases = (["rect", "oval"] as const).flatMap((shape, shapeRow) =>
    (["top", "bottom"] as const).flatMap((originalLayer, originalRow) =>
      (["top", "bottom"] as const).flatMap((layer, layerRow) =>
        [0, 90, 180, 270].map((rotation, column) => ({
          name: `U${shapeRow * 16 + originalRow * 8 + layerRow * 4 + column + 1}`,
          shape,
          originalLayer,
          layer,
          rotation,
          x: column * 12 - 18,
          y: 42 - (shapeRow * 4 + originalRow * 2 + layerRow) * 12,
        })),
      ),
    ),
  )
  circuit.add(
    <board
      width={58}
      height={110}
      pcbX={3}
      pcbY={-2}
      routingDisabled
      schematicDisabled
    >
      <pcbnotetext
        text="RECT / OVAL HOLES STAY INSIDE PAD GUIDES"
        pcbY={51}
        fontSize={0.9}
      />
      <group pcbX={2} pcbY={-1}>
        {cases.map((holeCase) => (
          <Fragment key={holeCase.name}>
            <chip
              name={holeCase.name}
              layer={holeCase.layer}
              pcbX={holeCase.x}
              pcbY={holeCase.y}
              pcbRotation={holeCase.rotation}
              footprint={
                <footprint originalLayer={holeCase.originalLayer}>
                  <smtpad
                    shape="rect"
                    width={3.4}
                    height={1.4}
                    pcbX={1.75}
                    pcbY={-0.5}
                    layer={holeCase.originalLayer}
                    portHints={["1"]}
                    noSolderPaste
                  />
                  <hole
                    shape={holeCase.shape}
                    width={3}
                    height={1}
                    pcbX={1.75}
                    pcbY={-0.5}
                  />
                </footprint>
              }
            />
            <pcbnotetext
              text={`${holeCase.shape} ${holeCase.originalLayer} to ${holeCase.layer} ${holeCase.rotation}deg`}
              pcbX={holeCase.x}
              pcbY={holeCase.y - 4}
              fontSize={0.5}
            />
          </Fragment>
        ))}
      </group>
    </board>,
  )
  circuit.render()
  const holeInstances = circuit
    .selectAll("hole")
    .filter((primitive) => primitive instanceof Hole)
  expect(holeInstances).toHaveLength(32)

  for (const holeCase of cases) {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: holeCase.name,
    })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const pad = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "rect")
      .find((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)!
    const hole = circuit.db.pcb_hole
      .list()
      .filter(
        (hole) => hole.hole_shape === "rect" || hole.hole_shape === "oval",
      )
      .find((hole) => hole.pcb_component_id === pcbComponent.pcb_component_id)!
    const holeInstance = holeInstances.find(
      (primitive) => primitive.pcb_hole_id === hole.pcb_hole_id,
    )!
    const expectedWidth = pad.width - 0.4
    const expectedHeight = pad.height - 0.4
    expect(hole.hole_shape).toBe(holeCase.shape)
    expect(hole.x).toBeCloseTo(pad.x)
    expect(hole.y).toBeCloseTo(pad.y)
    expect(hole.hole_width).toBeCloseTo(expectedWidth)
    expect(hole.hole_height).toBeCloseTo(expectedHeight)

    // Local size remains local; consumer bounds describe emitted board geometry.
    expect(holeInstance.getPcbSize()).toEqual({ width: 3, height: 1 })
    const emittedBounds = holeInstance._getPcbCircuitJsonBounds()
    expect(emittedBounds.center.x).toBeCloseTo(pad.x)
    expect(emittedBounds.center.y).toBeCloseTo(pad.y)
    expect(emittedBounds.width).toBeCloseTo(expectedWidth)
    expect(emittedBounds.height).toBeCloseTo(expectedHeight)
    expect(
      Math.abs(emittedBounds.bounds.right - emittedBounds.bounds.left),
    ).toBeCloseTo(expectedWidth)
    expect(
      Math.abs(emittedBounds.bounds.top - emittedBounds.bounds.bottom),
    ).toBeCloseTo(expectedHeight)
    expect(
      (emittedBounds.bounds.left + emittedBounds.bounds.right) / 2,
    ).toBeCloseTo(pad.x)
    expect(
      (emittedBounds.bounds.top + emittedBounds.bounds.bottom) / 2,
    ).toBeCloseTo(pad.y)
  }
  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 2400,
  })
})
