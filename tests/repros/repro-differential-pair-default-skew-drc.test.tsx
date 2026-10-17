import { beforeAll, expect, test } from "bun:test"
import { checkPcbBusLengthSkew } from "@tscircuit/checks"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const createCircuit = (maxLengthSkew?: number) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={34} height={24} schematicDisabled routingDisabled>
      <LengthTestTerminal name="P_TX" x={-10} y={4} />
      <LengthTestTerminal name="P_RX" x={10} y={4} />
      <LengthTestTerminal name="N_TX" x={-10} y={-4} />
      <LengthTestTerminal name="N_RX" x={10} y={-4} />
      <differentialpair
        name="USB"
        positiveConnection="DP"
        negativeConnection="DN"
        maxLengthSkew={maxLengthSkew}
      />
      <trace
        name="DP"
        from=".P_TX > .pin1"
        to=".P_RX > .pin1"
        pcbPathRelativeTo=".P_TX > .pin1"
        pcbPath={[
          { x: 0, y: 0 },
          { x: 20, y: 0 },
        ]}
      />
      <trace
        name="DN"
        from=".N_TX > .pin1"
        to=".N_RX > .pin1"
        pcbPathRelativeTo=".N_TX > .pin1"
        pcbPath={[
          { x: 0, y: 0 },
          { x: 0, y: -3 },
          { x: 20, y: -3 },
          { x: 20, y: 0 },
        ]}
      />
      <pcbnotetext
        pcbY={10}
        fontSize={0.6}
        text="USB pair: maxLengthSkew omitted"
      />
      <pcbnotetext pcbY={7} fontSize={0.55} text="DP: 20 mm" />
      <pcbnotetext
        pcbY={-10}
        fontSize={0.55}
        text="DN: 26 mm; actual skew: 6 mm"
      />
      <pcbnotetext
        pcbY={0}
        fontSize={0.45}
        text="Router default: 0.1 mm; emitted DRC limit: absent"
      />
    </board>,
  )
  circuit.render()
  return circuit
}

let actualSkewErrors: ReturnType<typeof checkPcbBusLengthSkew>
beforeAll(async () => {
  const circuit = createCircuit()
  expect(
    circuit.db.pcb_trace.list().map((trace) => trace.trace_length),
  ).toEqual([20, 26])
  // Remove copper only in this conversion to inspect the router's default;
  // the DRC input and snapshot keep the original, emitted manual copper.
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit
      .getCircuitJson()
      .filter((element) => element.type !== "pcb_trace"),
    subcircuitComponent: circuit.firstChild!,
  })
  expect(simpleRouteJson.differentialPairs?.[0]?.lengthTolerance).toBe(0.1)
  const explicitCircuit = createCircuit(0.1)
  expect(checkPcbBusLengthSkew(explicitCircuit.getCircuitJson())).toEqual([
    expect.objectContaining({
      actual_length_skew: 6,
      maximum_length_skew: 0.1,
    }),
  ])
  actualSkewErrors = checkPcbBusLengthSkew(circuit.getCircuitJson())
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 700,
  })
})

const regression =
  process.env.TSCIRCUIT_VERIFY_SIBLING_REPRO === "1" ? test : test.failing
regression(
  "the router's default differential-pair skew is also enforced by DRC",
  () => {
    expect(actualSkewErrors).toEqual([
      expect.objectContaining({
        actual_length_skew: 6,
        maximum_length_skew: 0.1,
      }),
    ])
  },
)
