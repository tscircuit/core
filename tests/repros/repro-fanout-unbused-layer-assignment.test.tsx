import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: unbused fanout endpoints ignore allowed layers", async () => {
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
        text="10 signals per boundary | Allowed: inner1 + bottom | PINNED: bottom"
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
    new Set(["top", "bottom"]),
  )
  const forbiddenPoints = points.filter((point) => point.layer === "top")
  // Record the current bug; the stacked fix changes this to zero.
  expect(forbiddenPoints).toHaveLength(16)
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
  // The PCB renderer does not draw breakout endpoints. Mark the emitted
  // board-world positions (mm, +X right, +Y up) with their assigned layer.
  for (const point of points) {
    circuit.db.pcb_note_rect.insert({
      center: { x: point.x, y: point.y },
      width: 0.2,
      height: 0.2,
      stroke_width: 0.05,
      layer: "top",
      color:
        point.layer === "inner1"
          ? "#b45c00"
          : point.layer === "bottom"
            ? "#215bca"
            : "#c52828",
      is_filled: true,
    })
  }
  circuit.db.pcb_note_text.insert({
    text: `Forbidden top endpoints: ${forbiddenPoints.length}/${points.length} | Orange: inner1 | Blue: bottom | Red: top`,
    anchor_position: { x: 0, y: -5 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.3,
    color: "#333333",
    layer: "top",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    showPcbGroups: true,
  })
})
