import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkHoleTraceClearance,
  checkPadTraceClearance,
  checkPadPadClearance,
  checkTracesAreContiguous,
} from "@tscircuit/checks"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: multilayer fanout completes a routed controller link", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={18}
      height={20}
      layers={4}
      minTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.1}
      minTraceToHoleEdgeClearance={0.1}
      minViaPadDiameter={0.3}
    >
      <breakout
        name="B1"
        pcbY={4}
        padding="0.3mm"
        fanoutRoutingLayers={["top", "inner1", "inner2", "bottom"]}
      >
        <chip name="U1" footprint="bga16_grid4x4_p0.8mm" />
      </breakout>
      <chip name="U2" footprint="bga16_grid4x4_p0.8mm" pcbY={-5} />
      {Array.from({ length: 16 }, (_, index) => (
        <trace
          key={`signal_${index}`}
          name={`SIGNAL_${index + 1}`}
          from={`U1.pin${index + 1}`}
          to={`U2.pin${index + 1}`}
        />
      ))}
      {Array.from({ length: 4 }, (_, busIndex) => (
        <Fragment key={`bus_${busIndex}`}>
          <bus
            name={`BUS_${busIndex}`}
            connections={Array.from(
              { length: 4 },
              (_, pinIndex) => `SIGNAL_${busIndex * 4 + pinIndex + 1}`,
            )}
            preferredLayers={["top", "inner1", "inner2", "bottom"]}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text="16-signal BGA link | Four layers | Fanout → global routing"
        pcbY={9}
        fontSize={0.34}
        color="#202832"
      />
      <pcbnotetext
        text="U1 controller"
        pcbX={-6}
        pcbY={6.5}
        fontSize={0.3}
        color="#202832"
      />
      <pcbnotetext
        text="BGA16 | 0.8mm"
        pcbX={-6}
        pcbY={6}
        fontSize={0.27}
        color="#202832"
      />
      <pcbnotetext
        text="U2: BGA16 peripheral, 0.8mm pitch"
        pcbY={-7.2}
        fontSize={0.3}
        color="#202832"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const routingErrors = circuit.db.pcb_autorouting_error.list()
  const exits = circuit.db.pcb_breakout_point.list()
  const traces = circuit.db.pcb_trace.list()
  const vias = circuit.db.pcb_via.list()
  const routedSignalIds = new Set(traces.map((trace) => trace.source_trace_id))
  const connectedSignals = circuit.db.source_trace
    .list()
    .filter((trace) => routedSignalIds.has(trace.source_trace_id))

  // Record the current planning failure while retaining the actual fallback routes.
  expect(routingErrors).toHaveLength(1)
  expect(routingErrors[0]!.message).toContain(
    "declared breakout edges need 3.60mm but expose only 3.40mm",
  )
  expect(exits).toHaveLength(0)
  expect(connectedSignals).toHaveLength(16)
  expect(traces).toHaveLength(16)
  expect(vias).toHaveLength(24)
  expect(
    json.filter(
      (element) =>
        element.type.endsWith("_error") &&
        element.type !== "pcb_autorouting_error",
    ),
  ).toEqual([])
  expect(checkEachPcbTraceNonOverlapping(json)).toEqual([])
  expect(checkHoleTraceClearance(json)).toEqual([])
  expect(checkPadTraceClearance(json)).toEqual([])
  expect(checkPadPadClearance(json)).toEqual([])
  expect(checkTracesAreContiguous(json)).toEqual([])

  let wireLength = 0
  for (const trace of traces) {
    for (let pointIndex = 1; pointIndex < trace.route.length; pointIndex++) {
      const previous = trace.route[pointIndex - 1]!
      const point = trace.route[pointIndex]!
      if (
        previous.route_type === "wire" &&
        point.route_type === "wire" &&
        previous.layer === point.layer
      ) {
        wireLength += Math.hypot(point.x - previous.x, point.y - previous.y)
      }
    }
  }
  // Native notes use emitted board-world geometry in mm (+X right, +Y up).
  const breakout = circuit.db.pcb_group.getWhere({ name: "B1" })!
  circuit.db.pcb_note_rect.insert({
    center: breakout.center,
    width: breakout.width!,
    height: breakout.height!,
    stroke_width: 0.025,
    layer: "top",
    color: "#58697b",
    is_filled: false,
  })
  for (const note of [
    {
      text: `Fanout exits: ${exits.length}/16 | Planning errors: ${routingErrors.length} | Connected signals: ${connectedSignals.length}/16`,
      y: 8,
    },
    {
      text: `Copper: ${wireLength.toFixed(2)}mm | ${vias.length} vias | ${traces.length} trace fragments`,
      y: -8.2,
    },
    {
      text: routingErrors.length
        ? "Fanout rejected: global routing falls back to original pads"
        : "Fanout accepted: global routing continues from all 16 exits",
      y: -9,
    },
  ]) {
    circuit.db.pcb_note_text.insert({
      text: note.text,
      anchor_position: { x: 0, y: note.y },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.3,
      layer: "top",
      color: routingErrors.length ? "#c52828" : "#215bca",
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1000,
    height: 1100,
    showPcbGroups: false,
    showDebugObjects: false,
    shouldDrawRatsNest: false,
  })
}, 60_000)
