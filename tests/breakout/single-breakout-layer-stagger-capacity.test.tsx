import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a multilayer breakout spills signals before staggered endpoints overflow its edge", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={18}
      height={20}
      layers={4}
      routingDisabled
      minTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.2}
      minViaPadDiameter={0.3}
    >
      <breakout
        name="B1"
        pcbY={4}
        padding="0.3mm"
        fanoutRoutingLayers={["top", "inner1", "inner2", "bottom"]}
      >
        <chip name="U1" footprint="bga16_grid4x4_p1mm" />
      </breakout>
      <chip name="U2" footprint="bga16_grid4x4_p1mm" pcbY={-5} />
      {Array.from({ length: 16 }, (_, index) => (
        <trace
          key={`signal_${index}`}
          name={`SIGNAL_${index + 1}`}
          from={`U1.pin${index + 1}`}
          to={`U2.pin${index + 1}`}
        />
      ))}
      <pcbnotetext
        text="Multilayer endpoints need stagger space: overflow exits another edge"
        pcbY={8}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const points = circuit.db.pcb_breakout_point.list()
  expect(points).toHaveLength(16)
  const group = circuit.db.pcb_group.getWhere({ name: "B1" })!
  const minY = group.center.y - group.height! / 2
  const bottomPoints = points.filter((point) => Math.abs(point.y - minY) < 0.01)
  expect(bottomPoints.length).toBeGreaterThan(0)
  expect(bottomPoints.length).toBeLessThan(points.length)
  // Mark emitted board-world positions in mm (+X right, +Y up).
  for (const point of points) {
    circuit.db.pcb_note_rect.insert({
      center: { x: point.x, y: point.y },
      width: 0.16,
      height: 0.16,
      stroke_width: 0.05,
      layer: "top",
      color: "#215bca",
      is_filled: true,
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    showPcbGroups: true,
  })
})
