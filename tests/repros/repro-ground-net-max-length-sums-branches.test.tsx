import { beforeAll, expect, test } from "bun:test"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const { circuit } = getTestFixture()

// Board-world positions in mm: +X right, +Y up. All four terminals share GND.
// Normal local autorouting creates three 4 mm branches, without injected routes.
circuit.add(
  <board width={26} height={24} schematicDisabled autorouter={{ local: true }}>
    <LengthTestTerminal name="GROUND_REF" x={-4} y={0} />
    <LengthTestTerminal name="C_TARGET" x={0} y={0} />
    <LengthTestTerminal name="C_REMOTE1" x={0} y={4} />
    <LengthTestTerminal name="C_REMOTE2" x={4} y={0} />
    <trace from=".GROUND_REF > .pin1" to="net.GND" />
    <trace
      name="TARGET_GND"
      from=".C_TARGET > .pin1"
      to="net.GND"
      maxLength="5.5mm"
    />
    <trace from=".C_REMOTE1 > .pin1" to="net.GND" />
    <trace from=".C_REMOTE2 > .pin1" to="net.GND" />
    <pcbnotetext text="GROUND_REF" pcbX={-4} pcbY={-1.2} fontSize={0.65} />
    <pcbnotetext text="C_TARGET" pcbX={0} pcbY={-1.2} fontSize={0.65} />
    <pcbnotetext text="C_REMOTE1" pcbX={0} pcbY={5.2} fontSize={0.65} />
    <pcbnotetext text="C_REMOTE2" pcbX={4} pcbY={-1.2} fontSize={0.65} />
    <pcbnotetext text="4 mm" pcbX={-2} pcbY={0.7} fontSize={0.6} />
    <pcbnotetext text="4 mm" pcbX={2} pcbY={0.7} fontSize={0.6} />
    <pcbnotetext text="4 mm" pcbX={1.2} pcbY={2.3} fontSize={0.6} />
    <pcbnotetext text="GND BRANCH LENGTH REPRO" pcbY={9} fontSize={1} />
    <pcbnotetext
      text="Every routed branch = 4 mm; TARGET_GND limit = 5.5 mm"
      pcbY={-5}
      fontSize={0.7}
    />
    <pcbnotetext
      text="Observed error: 8 mm = 4 + 4 unrelated GND branches"
      pcbY={-7}
      fontSize={0.7}
    />
  </board>,
)

beforeAll(async () => {
  await circuit.renderUntilSettled()
  const target = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "TARGET_GND")!
  const branches = circuit.db.pcb_trace.list()
  expect(branches).toHaveLength(3)
  for (const branch of branches) {
    expect(getTraceLength(branch.route)).toBeCloseTo(4)
  }
  const targetBranches = branches.filter(
    (branch) => branch.source_trace_id === target.source_trace_id,
  )
  expect(targetBranches).toHaveLength(2)
  expect(
    targetBranches.reduce(
      (sum, branch) => sum + getTraceLength(branch.route),
      0,
    ),
  ).toBeCloseTo(8)
  expect(circuit.db.pcb_trace_too_long_error.list()).toMatchObject([
    {
      source_trace_id: target.source_trace_id,
      actual_trace_length: 8,
      maximum_trace_length: 5.5,
    },
  ])

  // Setup and snapshot failures must not count as reproducing the known bug.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1100,
    height: 950,
    showErrors: true,
  })
})

// Known bug: core's routing DRC delegates to checkPcbTraceLengths in checks,
// which sums every PCB branch carrying the source trace ID. A net attachment
// should not become longer merely because unrelated GND branches were added.
test.failing("ground maxLength does not sum unrelated net branches", () => {
  expect(circuit.db.pcb_trace_too_long_error.list()).toHaveLength(0)
})
