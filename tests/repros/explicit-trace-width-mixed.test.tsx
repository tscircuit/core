import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
} from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Terminal = ({ name, x, y }: { name: string; x: number; y: number }) => (
  <chip
    name={name}
    pcbX={x}
    pcbY={y}
    pinLabels={{ pin1: "P" }}
    footprint={
      <footprint>
        <smtpad portHints={["pin1"]} shape="rect" width={1} height={1} />
      </footprint>
    }
  />
)

test("crossing explicit widths route separately without narrowing or overlapping", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={14}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.15}
      autorouter="auto_local"
      autorouterVersion="beta_pipeline9"
    >
      <Terminal name="POWER_IN" x={-7} y={0} />
      <Terminal name="POWER_OUT" x={7} y={0} />
      <Terminal name="SIGNAL_IN" x={0} y={-4} />
      <Terminal name="SIGNAL_OUT" x={0} y={4} />
      <trace name="POWER" from="POWER_IN.P" to="POWER_OUT.P" thickness={0.4} />
      <trace name="SIGNAL" from="SIGNAL_IN.P" to="SIGNAL_OUT.P" width={0.15} />
      <pcbnotetext
        text="POWER: 0.40 mm; SIGNAL: 0.15 mm"
        pcbY={6}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Crossing routes must retain both widths"
        pcbY={-6}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [name, width] of [
    ["POWER", 0.4],
    ["SIGNAL", 0.15],
  ] as const) {
    const sourceTrace = circuit.db.source_trace.getWhere({ name })!
    const widths = circuit.db.pcb_trace
      .list()
      .filter((trace) => trace.source_trace_id === sourceTrace.source_trace_id)
      .flatMap((trace) =>
        trace.route.flatMap((point) =>
          point.route_type === "wire" ? [point.width] : [],
        ),
      )
    expect(widths.length).toBeGreaterThan(0)
    expect([...new Set(widths)]).toEqual([width])
  }
  expect(
    checkEachPcbTraceNonOverlapping(circuit.getCircuitJson(), {
      minClearance: 0.1,
    }),
  ).toEqual([])
  expect(
    checkPadTraceClearance(circuit.getCircuitJson(), { minClearance: 0.15 }),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
}, 120_000)
