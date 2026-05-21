import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type XYPoint = { x: number; y: number }
type TraceSegment = { start: XYPoint; end: XYPoint; layer: string }

const pointsAreEqual = (a: XYPoint, b: XYPoint) =>
  Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9

const orientation = (a: XYPoint, b: XYPoint, c: XYPoint) =>
  (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)

const segmentIntersects = (a: XYPoint, b: XYPoint, c: XYPoint, d: XYPoint) => {
  if (
    pointsAreEqual(a, c) ||
    pointsAreEqual(a, d) ||
    pointsAreEqual(b, c) ||
    pointsAreEqual(b, d)
  ) {
    return false
  }

  return (
    orientation(a, b, c) * orientation(a, b, d) < 0 &&
    orientation(c, d, a) * orientation(c, d, b) < 0
  )
}

function expectNoPcbTraceIntersections(
  circuit: ReturnType<typeof getTestFixture>["circuit"],
) {
  const traces = circuit.db.pcb_trace.list()
  const getPointLayer = (point: (typeof traces)[number]["route"][number]) => {
    if (point.route_type === "wire") return point.layer
    if (point.route_type === "via") return point.from_layer
    return null
  }
  const getSegments = (trace: (typeof traces)[number]): TraceSegment[] => {
    const segments: TraceSegment[] = []
    for (let i = 0; i < trace.route.length - 1; i++) {
      const start = trace.route[i]
      const end = trace.route[i + 1]
      if (!("x" in start) || !("y" in start)) continue
      if (!("x" in end) || !("y" in end)) continue
      const layer = getPointLayer(start) ?? getPointLayer(end)
      if (!layer) continue
      segments.push({ start, end, layer })
    }
    return segments
  }

  for (let traceIndex = 0; traceIndex < traces.length; traceIndex++) {
    const segments = getSegments(traces[traceIndex])
    for (
      let nextTraceIndex = traceIndex + 1;
      nextTraceIndex < traces.length;
      nextTraceIndex++
    ) {
      const nextSegments = getSegments(traces[nextTraceIndex])
      for (const segment of segments) {
        for (const nextSegment of nextSegments) {
          if (segment.layer !== nextSegment.layer) continue
          expect(
            segmentIntersects(
              segment.start,
              segment.end,
              nextSegment.start,
              nextSegment.end,
            ),
          ).toBe(false)
        }
      }
    }
  }
}

test("autoroutingphase connection props assign phase index order", async () => {
  const renderSingleConnectionCircuit = async (
    snapshotName: string,
    horizontalPhaseIndex: number,
    verticalPhaseIndex: number,
  ) => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="12mm" height="12mm">
        <resistor
          name="H1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <resistor
          name="H2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <resistor
          name="V1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={-4}
        />
        <resistor
          name="V2"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={4}
        />
        <autoroutingphase
          phaseIndex={horizontalPhaseIndex}
          connection="H1.pin1"
        />
        <autoroutingphase
          phaseIndex={verticalPhaseIndex}
          connection="V1.pin1"
        />
        <trace from=".H1 > .pin1" to=".H2 > .pin1" />
        <trace from=".V1 > .pin1" to=".V2 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(2)
    expectNoPcbTraceIntersections(circuit)
    expect(circuit).toMatchPcbSnapshot(snapshotName)
  }

  const renderConnectionArrayCircuit = async (
    snapshotName: string,
    horizontalPhaseIndex: number,
    verticalPhaseIndex: number,
  ) => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="18mm" height="18mm">
        <resistor
          name="H1"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={-1}
        />
        <resistor
          name="H2"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={-1}
        />
        <resistor
          name="H3"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={1}
        />
        <resistor
          name="H4"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={1}
        />
        <resistor
          name="V1"
          resistance="1k"
          footprint="0402"
          pcbX={-1}
          pcbY={-7}
        />
        <resistor
          name="V2"
          resistance="1k"
          footprint="0402"
          pcbX={-1}
          pcbY={7}
        />
        <resistor
          name="V3"
          resistance="1k"
          footprint="0402"
          pcbX={1}
          pcbY={-7}
        />
        <resistor
          name="V4"
          resistance="1k"
          footprint="0402"
          pcbX={1}
          pcbY={7}
        />
        <autoroutingphase
          phaseIndex={horizontalPhaseIndex}
          connections={["H1.pin1", "H3.pin1"]}
        />
        <autoroutingphase
          phaseIndex={verticalPhaseIndex}
          connections={["V1.pin1", "V3.pin1"]}
        />
        <trace from=".H1 > .pin1" to=".H2 > .pin1" />
        <trace from=".H3 > .pin1" to=".H4 > .pin1" />
        <trace from=".V1 > .pin1" to=".V2 > .pin1" />
        <trace from=".V3 > .pin1" to=".V4 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(4)
    expectNoPcbTraceIntersections(circuit)
    expect(circuit).toMatchPcbSnapshot(snapshotName)
  }

  await renderSingleConnectionCircuit(
    `${import.meta.path}-horizontal-first`,
    0,
    1,
  )
  await renderSingleConnectionCircuit(
    `${import.meta.path}-vertical-first`,
    1,
    0,
  )
  await renderConnectionArrayCircuit(
    `${import.meta.path}-arrays-horizontal-first`,
    0,
    1,
  )
  await renderConnectionArrayCircuit(
    `${import.meta.path}-arrays-vertical-first`,
    1,
    0,
  )
})
