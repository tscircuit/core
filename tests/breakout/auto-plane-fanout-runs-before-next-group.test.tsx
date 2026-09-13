import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("auto plane fanout runs before its component group's signal phase", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="24mm" height="12mm" layers={4} autorouter="default">
      <copperpour layer="inner1" connectsTo="net.GND" />
      <fanout name="FIRST" autorouter="auto" padding="1.2mm" pcbX={-6}>
        <chip
          name="U1"
          noSchematicRepresentation
          pinLabels={{ pin1: "A", pin2: "B", pin3: "GND" }}
          connections={{ GND: "net.GND" }}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} pcbX={-1} width={0.5} height={0.5} shape="rect" />
              <smtpad portHints={["pin2"]} pcbX={1} width={0.5} height={0.5} shape="rect" />
              <smtpad portHints={["pin3"]} pcbY={-1} width={0.5} height={0.5} shape="rect" />
            </footprint>
          }
        />
        <trace name="FIRST_SIGNAL" from="U1.A" to="U1.B" />
      </fanout>
      <fanout name="SECOND" autorouter="auto" padding="1.2mm" pcbX={6}>
        <chip
          name="U2"
          noSchematicRepresentation
          pinLabels={{ pin1: "A", pin2: "B", pin3: "GND" }}
          connections={{ GND: "net.GND" }}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} pcbX={-1} width={0.5} height={0.5} shape="rect" />
              <smtpad portHints={["pin2"]} pcbX={1} width={0.5} height={0.5} shape="rect" />
              <smtpad portHints={["pin3"]} pcbY={-1} width={0.5} height={0.5} shape="rect" />
            </footprint>
          }
        />
        <trace name="SECOND_SIGNAL" from="U2.A" to="U2.B" />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  const firstSignal = circuit.db.source_trace.getWhere({ name: "FIRST_SIGNAL" })!
  const secondSignal = circuit.db.source_trace.getWhere({ name: "SECOND_SIGNAL" })!
  const firstGround = circuit.db.source_trace.list().find(
    (trace) => trace.display_name === ".U1 > .GND to net.GND",
  )!
  const phaseInputs = phases.map((phase) => phase.startSimpleRouteJson)
  const getSignalPhaseIndex = (sourceTraceId: string) =>
    phaseInputs.findIndex((input) =>
      input?.connections.some(
        (connection) => connection.source_trace_id === sourceTraceId,
      ),
    )
  const firstPlanePhaseIndex = phaseInputs.findIndex((input) =>
    input?.buses?.some((bus) => bus.busId === firstGround.source_trace_id),
  )

  expect(firstPlanePhaseIndex).toBeLessThan(
    getSignalPhaseIndex(firstSignal.source_trace_id),
  )
  expect(getSignalPhaseIndex(firstSignal.source_trace_id)).toBeLessThan(
    getSignalPhaseIndex(secondSignal.source_trace_id),
  )
  expect(
    circuit.getCircuitJson().filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
})
