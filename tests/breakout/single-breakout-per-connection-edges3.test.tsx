import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("single breakout spills connections off an over-capacity edge", async () => {
  const { circuit } = getTestFixture()

  const destinations = Array.from({ length: 12 }, (_, index) => index)
  circuit.add(
    <board width="50mm" height="40mm" routeRemaining={false}>
      <breakout name="B1" padding="0.5mm" fanoutRoutingLayers={["top"]}>
        <chip name="U1" footprint="bga16_grid4x4_p1mm" />
      </breakout>
      {destinations.map((index) => (
        <resistor
          key={String(index)}
          name={`R${index}`}
          resistance="1k"
          footprint="0402"
          pcbX={-8 + index * 1.5}
          pcbY={-15}
        />
      ))}
      {destinations.map((index) => (
        <trace
          key={String(index)}
          name={`SIG${index}`}
          from={`U1.pin${index + 1}`}
          to={`R${index}.pin1`}
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutGroup = circuit.db.pcb_group
    .list()
    .find((group) => group.name === "B1")!
  const minY = breakoutGroup.center.y - breakoutGroup.height! / 2
  const points = circuit.db.pcb_breakout_point.list()
  const bottomPoints = points.filter((point) => Math.abs(point.y - minY) < 0.01)

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(points).toHaveLength(12)
  // The bottom edge cannot hold all twelve single-layer exits.
  expect(bottomPoints.length).toBeGreaterThan(0)
  expect(bottomPoints.length).toBeLessThan(12)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
