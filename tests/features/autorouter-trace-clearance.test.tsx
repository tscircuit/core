import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board autorouter.traceClearance propagates to SimpleRouteJson and changes routed traces", async () => {
  const makeFixture = async (autorouter?: { traceClearance: string }) => {
    const { circuit } = getTestFixture()
    let autorouterInput: SimpleRouteJson | undefined
    circuit.on("autorouting:start", ({ simpleRouteJson }) => {
      autorouterInput = simpleRouteJson
    })
    circuit.add(
      <board width="26mm" height="24mm" autorouter={autorouter}>
        <chip name="U1" footprint="soic8" pcbX={-5} pcbY={0} />
        <pinheader name="J1" pinCount={8} pcbX={6} pcbY={0} pcbRotation={90} />
        <trace from=".U1 > .pin1" to=".J1 > .pin8" />
        <trace from=".U1 > .pin2" to=".J1 > .pin6" />
        <trace from=".U1 > .pin3" to=".J1 > .pin4" />
        <trace from=".U1 > .pin4" to=".J1 > .pin2" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return { autorouterInput, traces: circuit.db.pcb_trace.list() }
  }

  const baseline = await makeFixture(undefined)
  const widened = await makeFixture({ traceClearance: "0.5mm" })

  expect(baseline.autorouterInput?.minTraceToPadEdgeClearance).toBe(0.1)
  expect(widened.autorouterInput?.minTraceToPadEdgeClearance).toBe(0.5)
  expect(widened.traces.length).toBeGreaterThanOrEqual(4)
  expect(widened.traces.map((t) => t.route)).not.toEqual(
    baseline.traces.map((t) => t.route),
  )
})

test("board autorouter preset preserves traceClearance", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined

  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    autorouterInput = simpleRouteJson
  })

  circuit.add(
    <board
      width="14mm"
      height="10mm"
      autorouter={{
        preset: "auto_local",
        traceClearance: "0.35mm",
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autorouterInput?.minTraceToPadEdgeClearance).toBe(0.35)
})

test("autorouter.traceClearance respects stricter explicit minTraceToPadEdgeClearance and subcircuit groups", async () => {
  const { circuit: stricterMinTrace } = getTestFixture()
  let stricterInput: SimpleRouteJson | undefined
  stricterMinTrace.on("autorouting:start", ({ simpleRouteJson }) => {
    stricterInput = simpleRouteJson
  })
  stricterMinTrace.add(
    <board
      width="14mm"
      height="10mm"
      minTraceToPadEdgeClearance="0.6mm"
      autorouter={{ traceClearance: "0.4mm" }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await stricterMinTrace.renderUntilSettled()
  expect(stricterInput?.minTraceToPadEdgeClearance).toBe(0.6)

  const { circuit: subGroupCircuit } = getTestFixture()
  let subGroupInput: SimpleRouteJson | undefined
  subGroupCircuit.on("autorouting:start", ({ simpleRouteJson }) => {
    subGroupInput = simpleRouteJson
  })
  subGroupCircuit.add(
    <board width="16mm" height="12mm">
      <group subcircuit autorouter={{ traceClearance: "0.45mm" }}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </group>
    </board>,
  )
  await subGroupCircuit.renderUntilSettled()
  expect(subGroupInput?.minTraceToPadEdgeClearance).toBe(0.45)
})
