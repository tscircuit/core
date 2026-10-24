import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"

test("polygon paste vertices and islands follow copper markers on either footprint side", async () => {
  const points = [
    { x: 1, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
  ]
  const hole = [
    { x: 1.2, y: 0.2 },
    { x: 1.6, y: 0.2 },
    { x: 1.6, y: 0.6 },
  ]
  const originalPoints = structuredClone(points)
  const markerToFootprintTransform = compose(
    translate(1, -1),
    rotate((23 * Math.PI) / 180),
  )
  const markers = [...points, ...hole].map((point) =>
    applyToPoint(markerToFootprintTransform, point),
  )
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={56} height={44} routingDisabled schematicDisabled>
        <group pcbX={1} pcbY={-1} pcbRotation={30}>
          {(["top", "bottom"] as const).flatMap((originalLayer, row) =>
            [0, 90, 180, 270].map((pcbRotation, column) => (
              <chip
                key={`${originalLayer}-${pcbRotation}`}
                name={`J${row * 4 + column + 1}`}
                layer={layer}
                pcbX={-18 + column * 12}
                pcbY={5 - row * 10}
                pcbRotation={pcbRotation}
                footprint={
                  <footprint originalLayer={originalLayer} noSolderPaste>
                    {markers.map((point, pin) => (
                      <Fragment key={pin}>
                        <smtpad
                          shape="circle"
                          radius={0.08}
                          pcbX={point.x}
                          pcbY={point.y}
                          portHints={[`${pin + 1}`]}
                          layer={originalLayer}
                        />
                      </Fragment>
                    ))}
                    <solderpaste
                      shape="polygon"
                      points={points}
                      holes={[hole]}
                      pcbX={1}
                      pcbY={-1}
                      pcbRotation={23}
                      layer={originalLayer}
                    />
                  </footprint>
                }
              />
            )),
          )}
        </group>
        <pcbnotetext
          text={`${layer}: paste vertices / island align with copper markers`}
          pcbY={-19}
          fontSize={0.6}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_solder_paste.list()).toHaveLength(8)
    for (const aperture of circuit.db.pcb_solder_paste.list()) {
      if (aperture.shape !== "polygon")
        throw new Error("Expected polygon paste")
      expect(aperture.layer).toBe(layer)
      const markers = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.pcb_component_id === aperture.pcb_component_id)
      const vertices = [...aperture.points, ...aperture.holes!.flat()]
      expect(markers).toHaveLength(vertices.length)
      for (const [pin, vertex] of vertices.entries()) {
        const marker = markers[pin]!
        if (marker.shape !== "circle")
          throw new Error("Expected circular marker")
        expect(vertex.x).toBeCloseTo(marker.x, 7)
        expect(vertex.y).toBeCloseTo(marker.y, 7)
      }
      expect("x" in aperture).toBe(false)
      expect("y" in aperture).toBe(false)
    }
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      { showSolderPaste: true, layer },
    )
  }
  expect(points).toEqual(originalPoints)
})
