import { expect, test } from "bun:test"
import type { PcbSmtPadCircle } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"

test("opening placement and footprint side flips match emitted pad geometry", async () => {
  const points = [
    { x: -1, y: -1 },
    { x: 3, y: -1 },
    { x: 0, y: 2 },
  ]
  const rectCorners = [
    { x: 1, y: 0.5 },
    { x: 3, y: 0.5 },
    { x: 3, y: 1.5 },
    { x: 1, y: 1.5 },
  ]
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={40}
        height={26}
        pcbX={100}
        pcbY={-70}
        routingDisabled
        schematicDisabled
      >
        <group name="G" pcbX={1} pcbY={-1} pcbRotation={30}>
          {[0, 90, 180, 270].map((pcbRotation, index) => (
            <chip
              key={pcbRotation}
              name={`U${index}`}
              layer={layer}
              pcbX={-15 + index * 10}
              pcbY={1}
              pcbRotation={pcbRotation}
              footprint={
                <footprint originalLayer="top">
                  <smtpad
                    name="center"
                    shape="circle"
                    radius={0.2}
                    pcbX={2}
                    pcbY={1}
                    layer="top"
                    portHints={["1"]}
                  />
                  <pcbsoldermaskopening
                    name="RECT"
                    shape="rect"
                    width={2}
                    height={1}
                    pcbX={2}
                    pcbY={1}
                    layer="top"
                  />
                  <pcbsoldermaskopening
                    name="CIRCLE"
                    shape="circle"
                    radius={0.4}
                    pcbX={2}
                    pcbY={1}
                    layer="top"
                  />
                  <pcbsoldermaskopening
                    name="POLY"
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
                  {rectCorners.map((point, pin) => (
                    <Fragment key={`corner${pin}`}>
                      <smtpad
                        shape="circle"
                        radius={0.05}
                        pcbX={point.x}
                        pcbY={point.y}
                        layer="top"
                        portHints={[`${pin + 5}`]}
                      />
                    </Fragment>
                  ))}
                </footprint>
              }
            />
          ))}
        </group>
        <pcbnotetext
          text={`${layer}: 0 / 90 / 180 / 270 degrees, group 30 degrees`}
          pcbY={-11}
          fontSize={0.8}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    for (const pcbComponent of circuit.db.pcb_component.list()) {
      const pads = circuit.db.pcb_smtpad
        .list()
        .filter(
          (pad) => pad.pcb_component_id === pcbComponent.pcb_component_id,
        ) as PcbSmtPadCircle[]
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
            expect(point.x).toBeCloseTo(pads[index + 1]!.x, 7)
            expect(point.y).toBeCloseTo(pads[index + 1]!.y, 7)
          })
        } else {
          expect(opening.x).toBeCloseTo(pads[0]!.x, 7)
          expect(opening.y).toBeCloseTo(pads[0]!.y, 7)
          if (opening.shape !== "circle") {
            const transform = compose(
              translate(opening.x, opening.y),
              rotate(
                ((opening.shape === "rotated_rect" ? opening.ccw_rotation : 0) *
                  Math.PI) /
                  180,
              ),
            )
            for (const corner of rectCorners) {
              const emittedCorner = applyToPoint(transform, {
                x: corner.x - 2,
                y: corner.y - 1,
              })
              expect(
                pads
                  .slice(4)
                  .some(
                    (pad) =>
                      Math.abs(pad.x - emittedCorner.x) < 1e-7 &&
                      Math.abs(pad.y - emittedCorner.y) < 1e-7,
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
