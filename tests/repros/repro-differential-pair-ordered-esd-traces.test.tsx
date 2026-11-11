import { expectDifferentialPairLengths } from "tests/fixtures/expect-differential-pair-lengths"
import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ordered USB trace arrays constrain J1-ESD-MCU lane sums", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board
      width={24}
      height={24}
      pcbY={3}
      schematicDisabled
      autorouter="auto_local"
    >
      <chip
        name="J1"
        pcbX={-3}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "DP", pin2: "DM" }}
      />
      <chip
        name="ESD"
        pcbY={5}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "DP", pin2: "DM" }}
      />
      <chip
        name="MCU"
        pcbX={3}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "DP", pin2: "DM" }}
      />
      <trace name="DP1" from=".J1 > .DP" to=".ESD > .DP" />
      <trace name="DP2" from=".ESD > .DP" to=".MCU > .DP" />
      <trace name="DM1" from=".J1 > .DM" to=".ESD > .DM" />
      <trace name="DM2" from=".ESD > .DM" to=".MCU > .DM" />
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
      <pcbnotetext
        pcbY={7.5}
        text="Required: J1 -> ESD -> MCU on DP and DM"
        fontSize={0.55}
      />
      <pcbnotetext
        pcbY={-3}
        text="USB: ordered DP / DM hops; maximum lane skew 0.1mm"
        fontSize={0.45}
      />
      <pcbnotetext pcbX={-3} pcbY={-1.5} text="J1" fontSize={0.5} />
      <pcbnotetext pcbY={6.2} text="ESD" fontSize={0.5} />
      <pcbnotetext pcbX={3} pcbY={-1.5} text="MCU" fontSize={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  expectDifferentialPairLengths(circuit)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1600,
    height: 1200,
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(inputs).toHaveLength(1)
  const [dp1, dp2, dm1, dm2] = ["DP1", "DP2", "DM1", "DM2"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
  )
  expect(inputs[0].differentialPairs).toEqual([
    {
      connectionNames: [
        [dp1!, dp2!],
        [dm1!, dm2!],
      ],
      maxLengthSkewMm: 0.1,
    },
  ])
  expect(
    inputs[0].connections.map((connection) => connection.source_trace_id),
  ).toEqual(
    ["DP1", "DP2", "DM1", "DM2"].map(
      (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
    ),
  )
  expect(
    inputs[0].connections.map(
      (connection) => connection.pointsToConnect.length,
    ),
  ).toEqual([2, 2, 2, 2])
})
