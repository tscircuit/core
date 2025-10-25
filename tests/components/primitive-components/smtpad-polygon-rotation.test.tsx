import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import type { PcbSmtPadPolygon } from "circuit-json"

const polygonPoints = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

test("polygon smtpad points rotate with component rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" pcbX={0} pcbY={0} pcbRotation="90deg">
        <footprint>
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin1"]}
            points={polygonPoints}
          />
        </footprint>
      </chip>
    </board>,
  )

  await circuit.renderUntilSettled()

  const insertedPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad): pad is PcbSmtPadPolygon => pad.shape === "polygon")

  expect(insertedPads).toHaveLength(1)

  const [{ points }] = insertedPads

  const expectedPoints = polygonPoints.map(({ x, y }) => ({
    x: -y,
    y: x,
  }))

  for (let i = 0; i < expectedPoints.length; i++) {
    expect(points[i].x).toBeCloseTo(expectedPoints[i].x)
    expect(points[i].y).toBeCloseTo(expectedPoints[i].y)
  }
})
