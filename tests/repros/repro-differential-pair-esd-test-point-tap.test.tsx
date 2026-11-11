import { expectDifferentialPairLengths } from "tests/fixtures/expect-differential-pair-lengths"
import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ESD pair hops preserve ownership alongside an uncounted test-point tap", async () => {
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
      <chip
        name="TP"
        pcbX={6}
        pcbY={5}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              width={0.6}
              height={0.6}
              shape="rect"
            />
          </footprint>
        }
      />
      <trace name="DP1" from=".J1 > .DP" to=".ESD > .DP" />
      <trace name="DP2" from=".ESD > .DP" to=".MCU > .DP" />
      <trace name="DM1" from=".J1 > .DM" to=".ESD > .DM" />
      <trace name="DM2" from=".ESD > .DM" to=".MCU > .DM" />
      <trace name="TAP" from=".ESD > .DP" to=".TP > .pin1" />
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
      <pcbnotetext
        pcbY={7.5}
        text="Required: J1 -> ESD -> MCU; ESD.DP -> TP is an uncounted tap"
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-3}
        text="USB: exact hop ownership; test-point copper excluded from skew"
        fontSize={0.45}
      />
      <pcbnotetext pcbX={-3} pcbY={-1.5} text="J1" fontSize={0.5} />
      <pcbnotetext pcbY={6.2} text="ESD" fontSize={0.5} />
      <pcbnotetext pcbX={3} pcbY={-1.5} text="MCU" fontSize={0.5} />
      <pcbnotetext pcbX={6} pcbY={6.2} text="TP" fontSize={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(5)
  expectDifferentialPairLengths(circuit)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1600,
    height: 1200,
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
  expect(inputs).toHaveLength(1)
  const srj = inputs[0]
  const [dp1, dp2, dm1, dm2, tap] = ["DP1", "DP2", "DM1", "DM2", "TAP"].map(
    (name) => {
      const trace = circuit.db.source_trace.getWhere({ name })!
      return srj.connections.find(
        (connection) => connection.source_trace_id === trace.source_trace_id,
      )!
    },
  )
  expect(srj.connections).toHaveLength(5)
  expect(
    srj.connections.map((connection) => connection.pointsToConnect.length),
  ).toEqual([2, 2, 2, 2, 2])
  expect(dp1.pointsToConnect[1].pointId).toBe(dp2.pointsToConnect[0].pointId)
  expect(tap.pointsToConnect[0].pointId).toBe(dp1.pointsToConnect[1].pointId)
  expect(srj.differentialPairs).toEqual([
    {
      connectionNames: [
        [dp1.name, dp2.name],
        [dm1.name, dm2.name],
      ],
      maxLengthSkewMm: 0.1,
    },
  ])
})
