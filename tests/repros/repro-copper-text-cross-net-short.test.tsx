import { expect, test } from "bun:test"
import { segmentToSegmentMinDistance } from "@tscircuit/math-utils"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { CopperTextRoutingBoard } from "tests/fixtures/copper-text-routing-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: copper text bridges separate routed nets without a core error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<CopperTextRoutingBoard />)
  await circuit.renderUntilSettled()

  // Characterize the current bug. A fix should retain both nets while removing
  // the physical contact (or reporting it), rather than deleting the text.
  expect(circuit.db.pcb_copper_text.list()).toHaveLength(1)
  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces).toHaveLength(2)
  expect(
    sourceTraces[0]!.connected_source_port_ids.some((sourcePortId) =>
      sourceTraces[1]!.connected_source_port_ids.includes(sourcePortId),
    ),
  ).toBe(false)
  expect(
    circuit.getCircuitJson().filter((e) => e.type.includes("error")),
  ).toEqual([])

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(2)
  expect(new Set(pcbTraces.map((trace) => trace.source_trace_id)).size).toBe(2)
  const svg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson())
  // Measure the NATIVE renderer's actual dash and trace strokes in SVG space,
  // including its transform and physical stroke widths. No hand-drawn copper
  // or guessed glyph dimensions are substituted for the rendered geometry.
  const textPaths = [
    ...svg.matchAll(/<path\b[^>]*data-type="pcb_copper_text"[^>]*>/g),
  ]
  expect(textPaths).toHaveLength(1)
  const textPath = textPaths[0]![0]
  const pathCoordinates = textPath.match(
    /\bd="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"/,
  )!
  expect(pathCoordinates).not.toBeNull()
  const matrix = textPath
    .match(/transform="matrix\(([^)]+)\)"/)![1]!
    .split(",")
    .map(Number)
  const [a, b, c, d, e, f] = matrix
  expect(b).toBe(0)
  expect(c).toBe(0)
  expect(a).toBe(d)
  const textStart = {
    x: a! * Number(pathCoordinates[1]) + e!,
    y: d! * Number(pathCoordinates[2]) + f!,
  }
  const textEnd = {
    x: a! * Number(pathCoordinates[3]) + e!,
    y: d! * Number(pathCoordinates[4]) + f!,
  }
  const textWidth =
    Number(textPath.match(/stroke-width="([\d.]+)"/)![1]) * Math.abs(a!)
  const renderedTraces = [
    ...svg.matchAll(/<path\b[^>]*data-type="pcb_trace"[^>]*>/g),
  ]
  expect(renderedTraces).toHaveLength(2)
  for (const [renderedTrace] of renderedTraces) {
    const points = [...renderedTrace.matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map(
      (point) => ({ x: Number(point[1]), y: Number(point[2]) }),
    )
    expect(points.length).toBeGreaterThanOrEqual(2)
    const width = Number(renderedTrace.match(/stroke-width="([\d.]+)"/)![1])
    const minimumCopperGap = Math.min(
      ...points
        .slice(1)
        .map(
          (end, index) =>
            segmentToSegmentMinDistance(
              points[index]!,
              end,
              textStart,
              textEnd,
            ) -
            (width + textWidth) / 2,
        ),
    )
    // Negative edge-to-edge distance proves physical contact with BOTH nets.
    expect(minimumCopperGap).toBeLessThan(0)
  }

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  // Pads are at Y=+/-3; the text at the center is completely absent from SRJ.
  expect(simpleRouteJson.obstacles.length).toBeGreaterThan(0)
  expect(
    simpleRouteJson.obstacles.some(
      (obstacle) => Math.abs(obstacle.center.y) < obstacle.height / 2,
    ),
  ).toBe(false)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
