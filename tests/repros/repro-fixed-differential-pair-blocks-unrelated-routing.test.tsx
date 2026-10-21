import { beforeAll, expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const createCircuit = async (includePair: boolean) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={36}
      height={34}
      schematicDisabled
      autorouter={{ local: true }}
    >
      <LengthTestTerminal name="P_TX" x={-10} y={4} />
      <LengthTestTerminal name="P_RX" x={10} y={4} />
      <LengthTestTerminal name="N_TX" x={-10} y={-4} />
      <LengthTestTerminal name="N_RX" x={10} y={-4} />
      <LengthTestTerminal name="A_TX" x={-10} y={10} />
      <LengthTestTerminal name="A_RX" x={10} y={10} />
      {includePair && (
        <differentialpair
          name="USB"
          positiveConnection="DP"
          negativeConnection="DN"
          maxLengthSkew={0.1}
        />
      )}
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
          { x: 20, y: 0 },
        ]}
      />
      <trace name="AUX" from=".A_TX > .pin1" to=".A_RX > .pin1" />
      <pcbnotetext
        pcbY={15}
        fontSize={0.6}
        text="Fixed USB pair blocks unrelated AUX routing"
      />
      <pcbnotetext
        pcbY={12}
        fontSize={0.5}
        text="AUX: declared connection; missing copper"
      />
      <pcbnotetext pcbY={6} fontSize={0.5} text="DP: manually routed 20 mm" />
      <pcbnotetext
        pcbY={-6}
        fontSize={0.5}
        text="DN: manually routed 20 mm; skew: 0 mm"
      />
      <pcbnotetext
        pcbY={-11}
        fontSize={0.45}
        text="SRJ preparation cannot find the already-routed DP"
      />
      <pcbnotetext
        pcbY={-14}
        fontSize={0.45}
        text="Control: remove only differentialpair; AUX routes"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

let routedAuxCount = 0
beforeAll(async () => {
  const circuit = await createCircuit(true)
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
      subcircuitComponent: circuit.firstChild!,
    }),
  ).toThrow(/Could not find an SRJ connection.*DP.*USB/)
  const fixedSourceIds = ["DP", "DN"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
  )
  expect(
    circuit.db.pcb_trace
      .list()
      .filter((trace) => fixedSourceIds.includes(trace.source_trace_id!))
      .map((trace) => trace.trace_length),
  ).toEqual([20, 20])
  const control = await createCircuit(false)
  const controlAuxId = control.db.source_trace.getWhere({
    name: "AUX",
  })!.source_trace_id
  expect(
    control.db.pcb_trace
      .list()
      .filter((trace) => trace.source_trace_id === controlAuxId),
  ).toHaveLength(1)
  const auxId = circuit.db.source_trace.getWhere({
    name: "AUX",
  })!.source_trace_id
  routedAuxCount = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === auxId).length
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 850,
  })
})

const regression =
  process.env.TSCIRCUIT_VERIFY_SIBLING_REPRO === "1" ? test : test.failing
regression(
  "an already-routed differential pair does not prevent routing AUX",
  () => {
    expect(routedAuxCount).toBe(1)
  },
)
