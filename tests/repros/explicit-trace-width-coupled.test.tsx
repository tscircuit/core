import { expect, test } from "bun:test"
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

test("explicit width passes keep coupled connections together", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={14}
      minTraceWidth={0.1}
      autorouter="auto_local"
      autorouterVersion="beta_pipeline9"
    >
      <Terminal name="P_IN" x={-6} y={2} />
      <Terminal name="P_OUT" x={6} y={2} />
      <Terminal name="N_IN" x={-6} y={-2} />
      <Terminal name="N_OUT" x={6} y={-2} />
      <trace name="USB_P" from="P_IN.P" to="P_OUT.P" width={0.3} />
      <trace name="USB_N" from="N_IN.P" to="N_OUT.P" width={0.15} />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <pcbnotetext
        text="Coupled routes: both at least 0.30 mm"
        pcbY={5.5}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Both remain in one width pass"
        pcbY={-5.5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const name of ["USB_P", "USB_N"]) {
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
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(0.3)
  }
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
}, 120_000)
