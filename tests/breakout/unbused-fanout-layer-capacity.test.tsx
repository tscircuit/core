import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unbused fanout signals use the allowed layers without changing a pinned bus", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} layers={4} routingDisabled>
      {[-6, 6].map((pcbX, index) => (
        <breakout
          key={pcbX}
          name={`B${index + 1}`}
          pcbX={pcbX}
          padding={1}
          fanoutRoutingLayers={["inner1", "bottom"]}
        >
          <chip name={`U${index + 1}`} footprint="bga16_grid4x4_p1mm" />
        </breakout>
      ))}
      {Array.from({ length: 10 }, (_, index) => (
        <trace
          key={`signal_${index}`}
          name={`SIGNAL_${index + 1}`}
          from={`U1.pin${index + 1}`}
          to={`U2.pin${index + 1}`}
        />
      ))}
      <bus
        name="PINNED"
        connections={["SIGNAL_1", "SIGNAL_2"]}
        preferredLayer="bottom"
      />
      <pcbnotetext
        text="10 signals per boundary: inner1 + bottom; PINNED remains bottom"
        pcbY={5}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const points = circuit.db.pcb_breakout_point.list()
  expect(points).toHaveLength(20)
  expect(new Set(points.map((point) => point.layer))).toEqual(
    new Set(["inner1", "bottom"]),
  )
  for (const name of ["SIGNAL_1", "SIGNAL_2"]) {
    const sourceTrace = circuit.db.source_trace.getWhere({ name })!
    const pinnedPoints = points.filter(
      (point) => point.source_trace_id === sourceTrace.source_trace_id,
    )
    expect(pinnedPoints.map((point) => point.layer)).toEqual([
      "bottom",
      "bottom",
    ])
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    showPcbGroups: true,
  })
})
