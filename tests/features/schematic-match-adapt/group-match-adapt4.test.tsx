import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib"

test("group-match-adapt4", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled matchAdapt>
      <chip
        name="U1"
        manufacturerPartNumber="I2C_SENSOR"
        footprint="soic4"
        pinLabels={{
          pin1: "SCL",
          pin2: "SDA",
          pin3: "VCC",
          pin4: "GND",
        }}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["SCL", "SDA", "VCC", "GND"],
          },
        }}
        connections={{
          SCL: sel.net.SCL,
          SDA: sel.net.SDA,
          VCC: sel.net.V3_3,
          GND: sel.net.GND,
        }}
      />
    </board>,
  )

  circuit.render()

  const inlineSignalSourceTraceIds = new Set(
    circuit.db.schematic_text
      .list()
      .filter((text) => text.text === "SCL" || text.text === "SDA")
      .flatMap((text) => (text.source_trace_id ? [text.source_trace_id] : [])),
  )
  const schematicTraces = circuit.db.schematic_trace.list()
  const inlineSignalTraces = schematicTraces.filter(
    (trace) =>
      trace.source_trace_id &&
      inlineSignalSourceTraceIds.has(trace.source_trace_id),
  )
  expect(inlineSignalTraces).toHaveLength(2)

  for (const inlineSignalTrace of inlineSignalTraces) {
    const signalEdge = inlineSignalTrace.edges[0]!
    const signalY = signalEdge.from.y
    const signalMaxX = Math.max(signalEdge.from.x, signalEdge.to.x)
    const crossingVerticalEdges = schematicTraces
      .filter((trace) => trace !== inlineSignalTrace)
      .flatMap((trace) => trace.edges)
      .filter(
        (edge) =>
          Math.abs(edge.from.x - edge.to.x) < 1e-6 &&
          Math.min(edge.from.y, edge.to.y) <= signalY &&
          Math.max(edge.from.y, edge.to.y) >= signalY,
      )

    expect(crossingVerticalEdges.length).toBeGreaterThan(0)
    expect(
      Math.min(...crossingVerticalEdges.map((edge) => edge.from.x)) -
        signalMaxX,
    ).toBeGreaterThanOrEqual(0.049)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
