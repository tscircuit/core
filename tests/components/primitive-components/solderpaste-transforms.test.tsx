import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"

test("paste centers, corners and sides follow emitted pads under rotations and footprint flips", async () => {
  // Off-origin marker pads pin the emitted center and perimeter independently
  // of the paste implementation's decomposition of the footprint transform.
  const markers = [
    { x: 2, y: 1 },
    { x: 1, y: 0.5 },
    { x: 3, y: 0.5 },
    { x: 3, y: 1.5 },
    { x: 1, y: 1.5 },
  ]
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={48}
        height={36}
        pcbX={100}
        pcbY={-70}
        routingDisabled
        schematicDisabled
      >
        <group name="ROTATED" pcbX={1} pcbY={-1} pcbRotation={30}>
          {(["top", "bottom"] as const).map((originalLayer, row) =>
            [0, 90, 180, 270, 37].map((pcbRotation, column) => (
              <chip
                key={`${originalLayer}-${pcbRotation}`}
                name={`U${row * 5 + column + 1}`}
                layer={layer}
                pcbX={-16 + column * 8}
                pcbY={row === 0 ? 4 : -4}
                pcbRotation={pcbRotation}
                footprint={
                  <footprint originalLayer={originalLayer}>
                    {markers.map((point, pin) => (
                      <Fragment key={`${point.x},${point.y}`}>
                        <smtpad
                          shape="circle"
                          radius={0.1}
                          pcbX={point.x}
                          pcbY={point.y}
                          layer={originalLayer}
                          portHints={[`${pin + 1}`]}
                          solderPasteMargin={-0.1}
                        />
                      </Fragment>
                    ))}
                    <solderpaste
                      shape="rect"
                      width={2}
                      height={1}
                      pcbX={2}
                      pcbY={1}
                      layer={originalLayer}
                    />
                    <solderpaste
                      shape="circle"
                      radius={0.35}
                      pcbX={2}
                      pcbY={1}
                      layer={originalLayer}
                    />
                  </footprint>
                }
              />
            )),
          )}
        </group>
        <pcbnotetext
          text={`${layer}: paste corners align with copper markers`}
          pcbY={-14}
          fontSize={0.8}
        />
        <pcbnotetext
          text="0 / 90 / 180 / 270 / 37 deg + group 30 deg; both original layers"
          pcbY={-16}
          fontSize={0.65}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_solder_paste.list()).toHaveLength(20)
    for (const pcbComponent of circuit.db.pcb_component.list()) {
      const pads = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
      const apertures = circuit.db.pcb_solder_paste
        .list()
        .filter(
          (paste) => paste.pcb_component_id === pcbComponent.pcb_component_id,
        )
      expect(pads).toHaveLength(5)
      expect(apertures).toHaveLength(2)
      const centerPad = pads[0]!
      if (centerPad.shape !== "circle")
        throw new Error("Expected circular marker")
      for (const aperture of apertures) {
        if (aperture.shape === "polygon")
          throw new Error("Unexpected polygon aperture")
        expect(aperture.layer).toBe(layer)
        expect(aperture.x).toBeCloseTo(centerPad.x, 7)
        expect(aperture.y).toBeCloseTo(centerPad.y, 7)
        if (aperture.shape === "circle") {
          expect(aperture.radius).toBe(0.35)
          continue
        }
        if (aperture.shape !== "rect" && aperture.shape !== "rotated_rect")
          throw new Error("Expected rectangular aperture")
        const transform = compose(
          translate(aperture.x, aperture.y),
          rotate(
            ((aperture.shape === "rotated_rect" ? aperture.ccw_rotation : 0) *
              Math.PI) /
              180,
          ),
        )
        for (const x of [-1, 1])
          for (const y of [-1, 1]) {
            const corner = applyToPoint(transform, {
              x: (x * aperture.width) / 2,
              y: (y * aperture.height) / 2,
            })
            expect(
              pads
                .slice(1)
                .some(
                  (pad) =>
                    pad.shape === "circle" &&
                    Math.abs(pad.x - corner.x) < 1e-7 &&
                    Math.abs(pad.y - corner.y) < 1e-7,
                ),
            ).toBe(true)
          }
      }
    }
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      { showSolderPaste: true, layer },
    )
  }
})
