import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("BUG: series USB resistors emit two independent pair constraints instead of one total-lane constraint", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board
      width={24}
      height={14}
      schematicDisabled
      autorouter="auto_local"
      minTraceWidth={0.15}
    >
      <chip
        name="J1"
        pcbX={-7}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "DP", pin2: "DM" }}
      />
      <chip
        name="MCU"
        pcbX={7}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "DP", pin2: "DM" }}
      />
      <resistor
        name="R1"
        resistance="22"
        footprint="0402"
        pcbX={-2}
        pcbY={1.5}
      />
      <resistor
        name="R2"
        resistance="22"
        footprint="0402"
        pcbX={2}
        pcbY={-1.5}
      />
      <trace name="DP1" from=".J1 > .DP" to=".R1 > .pin1" />
      <trace name="DP2" from=".R1 > .pin2" to=".MCU > .DP" />
      <trace name="DM1" from=".J1 > .DM" to=".R2 > .pin1" />
      <trace name="DM2" from=".R2 > .pin2" to=".MCU > .DM" />
      {/* Today's scalar workaround constrains sections independently. The fix
          should use [DP1, DP2] / [DM1, DM2], excluding each resistor body. */}
      <differentialpair
        name="BEFORE_R"
        positiveConnection="DP1"
        negativeConnection="DM1"
        maxLengthSkew={0.1}
      />
      <differentialpair
        name="AFTER_R"
        positiveConnection="DP2"
        negativeConnection="DM2"
        maxLengthSkew={0.1}
      />
      <pcbnotetext
        pcbY={5}
        text="J1 -> R1/R2 (22 ohm) -> MCU"
        fontSize={0.55}
      />
      <pcbnotetext
        pcbY={-4}
        text="BUG: two section constraints, no single total copper-length constraint"
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-5}
        text="R1/R2 bodies are gaps, never board copper"
        fontSize={0.45}
      />
      <pcbnotetext pcbX={-7} pcbY={2} text="J1" fontSize={0.45} />
      <pcbnotetext pcbX={7} pcbY={2} text="MCU" fontSize={0.45} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(inputs).toHaveLength(1)
  const srj = inputs[0]
  const traces = ["DP1", "DP2", "DM1", "DM2"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!,
  )
  const [dp1, dp2, dm1, dm2] = traces.map((trace) => trace.source_trace_id)
  // BUG: two per-section tolerances cannot express the decided total-lane
  // constraint. Flip to [[dp1, dp2], [dm1, dm2]] with maxLengthSkewMm in the fix.
  expect(srj.differentialPairs).toEqual([
    { connectionNames: [dp1, dm1], lengthTolerance: 0.1 },
    { connectionNames: [dp2, dm2], lengthTolerance: 0.1 },
  ])
  expect(srj.connections).toHaveLength(4)
  for (const trace of traces) {
    const hop = srj.connections.find(
      (connection) => connection.source_trace_id === trace.source_trace_id,
    )!
    expect(
      hop.pointsToConnect.map(
        (point) => circuit.db.pcb_port.get(point.pcb_port_id!)!.source_port_id,
      ),
    ).toEqual(trace.connected_source_port_ids)
  }
  // No invented connection across either resistor body, and all four real
  // copper hops route. This is today's workaround, not aggregate matching.
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
