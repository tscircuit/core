import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an authored ellipse follows its major-axis markers on both footprint faces, including cached footprints", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={48} height={18} routingDisabled schematicDisabled>
        <subcircuit name="Ovals" _subcircuitCachingEnabled={cached}>
          <chip
            name="PTH"
            pcbX={20}
            footprint={
              <footprint>
                <smtpad
                  shape="rect"
                  width={0.4}
                  height={0.4}
                  pcbX={1}
                  portHints={["2"]}
                  noSolderPaste
                />
                <platedhole
                  shape="oval"
                  holeWidth={0.6}
                  holeHeight={0.3}
                  outerWidth={0.9}
                  outerHeight={0.65}
                  portHints={["1"]}
                />
              </footprint>
            }
          />
          {(["top", "bottom"] as const).flatMap((layer, row) =>
            [0, 35, 90, 180, 270].map((angle, i) => {
              const a = (angle * Math.PI) / 180
              return (
                <chip
                  key={`${layer}-${angle}`}
                  name={`U${row * 5 + i + 1}`}
                  layer={layer}
                  pcbRotation={angle === 35 ? -35 : angle === 180 ? 35 : 0}
                  pcbX={i * 8 - 16}
                  pcbY={row * 8 - 4}
                  footprint={
                    <footprint>
                      <solderpaste
                        shape="oval"
                        width={4}
                        height={1}
                        pcbRotation={angle}
                      />
                      {[-1, 1].map((sign, pin) => (
                        <Fragment key={sign}>
                          <smtpad
                            shape="circle"
                            radius={0.07}
                            portHints={[String(pin + 1)]}
                            pcbX={sign * 2 * Math.cos(a)}
                            pcbY={sign * 2 * Math.sin(a)}
                            noSolderPaste
                          />
                        </Fragment>
                      ))}
                    </footprint>
                  }
                />
              )
            }),
          )}
        </subcircuit>
      </board>,
    )
    await circuit.renderUntilSettled()
    const apertures = circuit.db.pcb_solder_paste.list()
    expect(apertures).toHaveLength(12)
    const hole = circuit.db.pcb_plated_hole.list()[0]!
    const onHole = apertures.filter(
      (p) => p.pcb_component_id === hole.pcb_component_id,
    )
    expect(onHole.map((p) => p.layer).sort()).toEqual(["bottom", "top"])
    for (const aperture of apertures.filter(
      (p) => p.pcb_component_id !== hole.pcb_component_id,
    )) {
      const markers = circuit.db.pcb_smtpad
        .list()
        .filter(
          (p) =>
            p.pcb_component_id === aperture.pcb_component_id &&
            p.shape === "circle",
        )
      expect(markers).toHaveLength(2)
      for (const marker of markers) {
        if (marker.shape !== "circle")
          throw new Error("Expected a circular endpoint marker")
        expect(aperture.layer).toBe(marker.layer)
        if (aperture.shape === "oval") {
          const dx = (marker.x - aperture.x) / (aperture.width / 2),
            dy = (marker.y - aperture.y) / (aperture.height / 2)
          expect(dx * dx + dy * dy).toBeCloseTo(1, 6)
        } else if (aperture.shape === "polygon") {
          expect(
            aperture.points.some(
              (p) => Math.hypot(p.x - marker.x, p.y - marker.y) < 1e-6,
            ),
          ).toBe(true)
        } else {
          throw new Error("Expected an ellipse or its rotated contour")
        }
      }
    }
  }
})
