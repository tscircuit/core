import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import type { PcbSmtPadPolygon } from "circuit-json"

const polygonPoints = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

const chipPlacements = [
  { name: "U0", pcbRotation: "0deg", pcbX: -12, pcbY: 12, label: "0°" },
  { name: "U45", pcbRotation: "45deg", pcbX: 12, pcbY: 12, label: "45°" },
  { name: "U90", pcbRotation: "90deg", pcbX: -12, pcbY: -12, label: "90°" },
  { name: "U180", pcbRotation: "180deg", pcbX: 12, pcbY: -12, label: "180°" },
] as const

const [chip0, chip45, chip90, chip180] = chipPlacements

const labelOffset = 6

const rotatePoint = (x: number, y: number, rotationDegrees: number) => {
  const angleRad = (rotationDegrees * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

test("polygon smtpad points rotate with component rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <chip
        name={chip0.name}
        pcbX={chip0.pcbX}
        pcbY={chip0.pcbY}
        pcbRotation={chip0.pcbRotation}
      >
        <footprint>
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin1"]}
            points={polygonPoints}
          />
        </footprint>
      </chip>

      <chip
        name={chip45.name}
        pcbX={chip45.pcbX}
        pcbY={chip45.pcbY}
        pcbRotation={chip45.pcbRotation}
      >
        <footprint>
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin1"]}
            points={polygonPoints}
          />
        </footprint>
      </chip>

      <chip
        name={chip90.name}
        pcbX={chip90.pcbX}
        pcbY={chip90.pcbY}
        pcbRotation={chip90.pcbRotation}
      >
        <footprint>
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin1"]}
            points={polygonPoints}
          />
        </footprint>
      </chip>

      <chip
        name={chip180.name}
        pcbX={chip180.pcbX}
        pcbY={chip180.pcbY}
        pcbRotation={chip180.pcbRotation}
      >
        <footprint>
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin1"]}
            points={polygonPoints}
          />
        </footprint>
      </chip>

      <silkscreentext
        text={chip0.label}
        pcbX={chip0.pcbX}
        pcbY={chip0.pcbY + labelOffset}
        fontSize={2}
        anchorAlignment="center"
      />

      <silkscreentext
        text={chip45.label}
        pcbX={chip45.pcbX}
        pcbY={chip45.pcbY + labelOffset}
        fontSize={2}
        anchorAlignment="center"
      />

      <silkscreentext
        text={chip90.label}
        pcbX={chip90.pcbX}
        pcbY={chip90.pcbY + labelOffset}
        fontSize={2}
        anchorAlignment="center"
      />

      <silkscreentext
        text={chip180.label}
        pcbX={chip180.pcbX}
        pcbY={chip180.pcbY + labelOffset}
        fontSize={2}
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const insertedPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad): pad is PcbSmtPadPolygon => pad.shape === "polygon")

  expect(insertedPads).toHaveLength(chipPlacements.length)

  insertedPads.forEach((pad, index) => {
    const placement = chipPlacements[index]
    const rotationDegrees = parseFloat(placement.pcbRotation)

    const expectedPoints = polygonPoints.map(({ x, y }) => {
      const rotated = rotatePoint(x, y, rotationDegrees)
      return {
        x: rotated.x + placement.pcbX,
        y: rotated.y + placement.pcbY,
      }
    })

    expect(pad.points).toHaveLength(expectedPoints.length)

    for (let i = 0; i < expectedPoints.length; i++) {
      expect(pad.points[i].x).toBeCloseTo(expectedPoints[i].x)
      expect(pad.points[i].y).toBeCloseTo(expectedPoints[i].y)
    }
  })
})
