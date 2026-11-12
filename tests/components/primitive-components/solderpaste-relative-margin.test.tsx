import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("local paste margins survive a quarter turn, either polygon winding and subcircuit caching", async () => {
  const corners = [
    { x: -2, y: -1 },
    { x: 2, y: -1 },
    { x: 2, y: 1 },
    { x: -2, y: 1 },
  ]
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        defaultSolderPasteMarginRatio={-0.1}
        width={26}
        height={16}
        routingDisabled
        schematicDisabled
      >
        <subcircuit name="Stencil" _subcircuitCachingEnabled={cached}>
          <chip
            name="U1"
            pcbRotation={90}
            footprint={
              <footprint>
                <smtpad shape="circle" radius={1} pcbY={4} portHints={["4"]} />
                <smtpad
                  shape="rect"
                  width={4}
                  height={2}
                  portHints={["1"]}
                  solderPasteMarginRatio={{ x: -0.1, y: -0.25 }}
                  solderPasteMargin={-0.1}
                />
                <smtpad
                  shape="circle"
                  radius={0.5}
                  pcbX={4}
                  portHints={["2"]}
                  solderPasteMarginRatio={0}
                />
                <smtpad
                  shape="circle"
                  radius={0.5}
                  pcbX={-4}
                  portHints={["3"]}
                  solderPasteMarginRatio={-0.5}
                />
              </footprint>
            }
          />
          {[corners, [...corners].reverse()].map((points, i) => (
            <chip
              key={i}
              name={`P${i + 1}`}
              pcbX={i ? 7 : -7}
              footprint={
                <footprint>
                  <smtpad
                    shape="polygon"
                    points={points}
                    portHints={["1"]}
                    solderPasteMarginRatio={-0.1}
                    solderPasteMargin={-0.1}
                  />
                </footprint>
              }
            />
          ))}
        </subcircuit>
      </board>,
    )
    await circuit.renderUntilSettled()
    const openings = circuit.db.pcb_solder_paste.list()
    expect(openings).toHaveLength(5)
    const rect = openings.find(
      (p) => p.shape === "rect" || p.shape === "rotated_rect",
    )!
    if (rect.shape !== "rect" && rect.shape !== "rotated_rect")
      throw new Error("Missing rectangular aperture")
    const quarterTurn =
      rect.shape === "rotated_rect" &&
      Math.abs(Math.round(rect.ccw_rotation / 90)) % 2 === 1
    expect(quarterTurn ? rect.height : rect.width).toBeCloseTo(0.8)
    expect(quarterTurn ? rect.width : rect.height).toBeCloseTo(3)
    expect(
      openings
        .filter((p) => p.shape === "circle")
        .map((p) => p.radius)
        .sort(),
    ).toEqual([0.5, 0.8])
    const polygons = openings.filter((p) => p.shape === "polygon")
    expect(polygons).toHaveLength(2)
    for (const contour of polygons) {
      const xs = contour.points.map((p) => p.x),
        ys = contour.points.map((p) => p.y)
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(3)
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(1.4)
    }
  }
})
