import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"

test("cached component footprints preserve opening geometry relative to their pads", async () => {
  const points = [
    { x: -1, y: -1 },
    { x: 3, y: -1 },
    { x: 0, y: 2 },
  ]
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={42}
        height={18}
        pcbX={100}
        pcbY={-70}
        routingDisabled
        schematicDisabled
      >
        <subcircuit name="CACHED" _subcircuitCachingEnabled pcbX={1} pcbY={2}>
          {[0, 90, 180, 270].map((pcbRotation, index) => (
            <chip
              key={pcbRotation}
              name={`U${index}`}
              pcbX={-15 + index * 10}
              pcbY={1}
              pcbRotation={pcbRotation}
              layer={layer}
              footprint={
                <footprint originalLayer="top">
                  <smtpad
                    shape="rect"
                    width={2}
                    height={1}
                    pcbX={2}
                    pcbY={1}
                    layer="top"
                    portHints={["1"]}
                  />
                  <pcbsoldermaskopening
                    shape="rect"
                    width={2}
                    height={1}
                    pcbX={2}
                    pcbY={1}
                    layer="top"
                  />
                  <pcbsoldermaskopening
                    shape="circle"
                    radius={0.4}
                    pcbX={2}
                    pcbY={1}
                    layer="top"
                  />
                  <pcbsoldermaskopening
                    shape="polygon"
                    points={points}
                    layer="top"
                  />
                  {points.map((point, pin) => (
                    <Fragment key={pin}>
                      <smtpad
                        shape="circle"
                        radius={0.1}
                        pcbX={point.x}
                        pcbY={point.y}
                        layer="top"
                        portHints={[`${pin + 2}`]}
                      />
                    </Fragment>
                  ))}
                </footprint>
              }
            />
          ))}
        </subcircuit>
        <pcbnotetext
          text={`Cached ${layer} footprints: 0 / 90 / 180 / 270 degrees`}
          pcbY={-5}
          fontSize={0.7}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    for (const pcbComponent of circuit.db.pcb_component.list()) {
      const pads = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
      const openings = circuit.db.pcb_soldermask_opening
        .list()
        .filter(
          (opening) =>
            opening.pcb_component_id === pcbComponent.pcb_component_id,
        )
      expect(openings).toHaveLength(3)
      for (const opening of openings) {
        expect(opening.layer).toBe(layer)
        if (opening.shape === "polygon") {
          opening.points.forEach((point, index) => {
            const pad = pads[index + 1]!
            if (pad.shape !== "circle")
              throw new Error("Expected marker circle")
            expect(point.x).toBeCloseTo(pad.x, 7)
            expect(point.y).toBeCloseTo(pad.y, 7)
          })
        } else {
          const pad = pads[0]!
          if (pad.shape !== "rect" && pad.shape !== "rotated_rect")
            throw new Error("Expected rectangular contact")
          expect(opening.x).toBeCloseTo(pad.x, 7)
          expect(opening.y).toBeCloseTo(pad.y, 7)
          if (opening.shape !== "circle") {
            const padAngle = pad.shape === "rotated_rect" ? pad.ccw_rotation : 0
            const openingAngle =
              opening.shape === "rotated_rect" ? opening.ccw_rotation : 0
            const padTransform = compose(
              translate(pad.x, pad.y),
              rotate((padAngle * Math.PI) / 180),
            )
            const openingTransform = compose(
              translate(opening.x, opening.y),
              rotate((openingAngle * Math.PI) / 180),
            )
            const padCorners = [-1, 1].flatMap((x) =>
              [-1, 1].map((y) =>
                applyToPoint(padTransform, {
                  x: (x * pad.width) / 2,
                  y: (y * pad.height) / 2,
                }),
              ),
            )
            for (const x of [-1, 1])
              for (const y of [-1, 1]) {
                const corner = applyToPoint(openingTransform, {
                  x: (x * opening.width) / 2,
                  y: (y * opening.height) / 2,
                })
                expect(
                  padCorners.some(
                    (padCorner) =>
                      Math.abs(corner.x - padCorner.x) < 1e-7 &&
                      Math.abs(corner.y - padCorner.y) < 1e-7,
                  ),
                ).toBe(true)
              }
          }
        }
      }
    }
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      { showSolderMask: true, layer },
    )
  }
})
