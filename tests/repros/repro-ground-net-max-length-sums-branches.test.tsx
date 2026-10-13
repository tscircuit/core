import { beforeAll, expect, test } from "bun:test"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const Terminal = ({
  name,
  x,
  y,
  requiresPower = false,
}: { name: string; x: number; y: number; requiresPower?: boolean }) => (
  <chip
    name={name}
    pcbX={x}
    pcbY={y}
    pinLabels={{ pin1: "TERMINAL" }}
    pinAttributes={{ pin1: { requiresPower } }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX={0}
          pcbY={0}
          width={0.2}
          height={0.2}
          shape="rect"
        />
      </footprint>
    }
  />
)

// Board-world positions in mm: +X right, +Y up. The capacitor ground pad is
// at (0, 0). Every naturally routed ground branch is 0.75 mm long.
// Neither the capacitor nor any trace declares an explicit length limit.
circuit.add(
  <board width={7} height={7} schematicDisabled autorouter={{ local: true }}>
    <net name="V3V3" isPowerNet />
    <Terminal name="GROUND_REF" x={-0.75} y={0} />
    <capacitor
      name="C_TARGET"
      capacitance="100nF"
      pcbX={0}
      pcbY={0}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX={0}
            pcbY={-0.5}
            width={0.2}
            height={0.2}
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX={0}
            pcbY={0}
            width={0.2}
            height={0.2}
            shape="rect"
          />
        </footprint>
      }
    />
    <Terminal name="C_REMOTE1" x={0} y={0.75} />
    <Terminal name="C_REMOTE2" x={0.75} y={0} />
    <Terminal name="POWER_REF" x={0} y={-1.25} requiresPower />
    <trace from=".GROUND_REF > .pin1" to="net.GND" />
    <trace name="TARGET_GND" from=".C_TARGET > .pin2" to="net.GND" />
    <trace from=".C_REMOTE1 > .pin1" to="net.GND" />
    <trace from=".C_REMOTE2 > .pin1" to="net.GND" />
    <trace from=".C_TARGET > .pin1" to=".POWER_REF > .pin1" />
    <trace from=".POWER_REF > .pin1" to="net.V3V3" />
    <pcbnotetext
      text="DECOUPLING GND LENGTH REPRO"
      pcbY={2.7}
      fontSize={0.25}
    />
    <pcbnotetext text="GROUND_REF" pcbX={-1.35} pcbY={-0.3} fontSize={0.17} />
    <pcbnotetext
      text="C_TARGET 100 nF"
      pcbX={1.3}
      pcbY={-0.6}
      fontSize={0.17}
    />
    <pcbnotetext text="C_REMOTE1" pcbX={0} pcbY={1.1} fontSize={0.17} />
    <pcbnotetext text="C_REMOTE2" pcbX={1.3} pcbY={0.3} fontSize={0.17} />
    <pcbnotetext text="V3V3" pcbX={0} pcbY={-1.55} fontSize={0.17} />
    <pcbnotetext
      text="Each GND branch = 0.75 mm; inferred limit = 1 mm"
      pcbY={-2.3}
      fontSize={0.19}
    />
    <pcbnotetext
      text="Wrong total: 1.5 mm = two unrelated GND branches"
      pcbY={-2.7}
      fontSize={0.19}
    />
  </board>,
)

beforeAll(async () => {
  await circuit.renderUntilSettled()
  const target = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "TARGET_GND")!
  const capacitor = circuit.db.source_component
    .list()
    .find((component) => component.name === "C_TARGET")!
  expect(capacitor).toMatchObject({ max_decoupling_trace_length: 1 })
  expect(target.max_length).toBe(1)
  const groundSourceIds = new Set(
    circuit.db.source_trace
      .list()
      .filter(
        (trace) =>
          trace.subcircuit_connectivity_map_key ===
          target.subcircuit_connectivity_map_key,
      )
      .map((trace) => trace.source_trace_id),
  )
  const branches = circuit.db.pcb_trace
    .list()
    .filter((branch) => groundSourceIds.has(branch.source_trace_id!))
  expect(branches).toHaveLength(3)
  for (const branch of branches)
    expect(getTraceLength(branch.route)).toBeCloseTo(0.75)
  const targetBranches = branches.filter(
    (branch) => branch.source_trace_id === target.source_trace_id,
  )
  expect(targetBranches).toHaveLength(2)
  expect(
    targetBranches.reduce(
      (sum, branch) => sum + getTraceLength(branch.route),
      0,
    ),
  ).toBeCloseTo(1.5)
  expect(circuit.db.pcb_trace_too_long_error.list()).toMatchObject([
    {
      source_trace_id: target.source_trace_id,
      actual_trace_length: 1.5,
      maximum_trace_length: 1,
    },
  ])
  // Setup and snapshot failures must not disguise themselves as a known failure.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 1000,
    showErrors: true,
  })
})

// Known bug: the capacitor's automatically inferred decoupling limit propagates
// to its ground-net attachment, then checkPcbTraceLengths sums unrelated branches.
test.failing(
  "automatic decoupling length does not aggregate the ground net",
  () => {
    expect(circuit.db.pcb_trace_too_long_error.list()).toHaveLength(0)
  },
)
