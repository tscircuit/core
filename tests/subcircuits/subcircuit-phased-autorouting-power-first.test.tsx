import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit phased autorouting routes thick power traces before signals", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="20mm">
      <subcircuit
        name="POWER_STAGE"
        autorouter={{ local: true, groupMode: "subcircuit" }}
      >
        <resistor
          name="R_PWR_TOP_L"
          resistance="1k"
          footprint="0402"
          pcbX={-8}
          pcbY={3}
        />
        <resistor
          name="R_PWR_TOP_R"
          resistance="1k"
          footprint="0402"
          pcbX={8}
          pcbY={3}
        />
        <resistor
          name="R_PWR_BOT_L"
          resistance="1k"
          footprint="0402"
          pcbX={-8}
          pcbY={-3}
        />
        <resistor
          name="R_PWR_BOT_R"
          resistance="1k"
          footprint="0402"
          pcbX={8}
          pcbY={-3}
        />
        <resistor
          name="R_SIG_TOP"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={8}
        />
        <resistor
          name="R_SIG_BOT"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={-8}
        />

        <trace
          from=".R_PWR_TOP_L > .pin2"
          to=".R_PWR_TOP_R > .pin1"
          thickness={1.2}
          routingPhaseIndex={0}
        />
        <trace
          from=".R_PWR_BOT_L > .pin2"
          to=".R_PWR_BOT_R > .pin1"
          thickness={1.2}
          routingPhaseIndex={0}
        />
        <trace
          from=".R_SIG_TOP > .pin1"
          to=".R_SIG_BOT > .pin1"
          routingPhaseIndex={null}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const signalSourceTrace = circuit.db.source_trace
    .list()
    .find((sourceTrace) => !sourceTrace.min_trace_thickness)

  expect(signalSourceTrace).toBeDefined()

  const signalPcbTraces = circuit.db.pcb_trace
    .list()
    .filter(
      (pcbTrace) =>
        pcbTrace.source_trace_id === signalSourceTrace?.source_trace_id,
    )

  expect(signalPcbTraces.length).toBeGreaterThan(0)

  const signalUsesViaOrDetoursAroundPowerRails = signalPcbTraces.some(
    (pcbTrace) =>
      pcbTrace.route.some((point) => point.route_type === "via") ||
      pcbTrace.route.some((point) => Math.abs(point.x) > 8),
  )

  expect(signalUsesViaOrDetoursAroundPowerRails).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
