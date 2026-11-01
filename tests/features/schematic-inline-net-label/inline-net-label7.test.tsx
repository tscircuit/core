import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace schDisplayLabel on branched connectivity renders inline schematic_text", async () => {
  const { circuit: pathTraceCircuit } = getTestFixture()
  pathTraceCircuit.add(
    <board routingDisabled schMaxTraceDistance={10}>
      <chip
        name="J1"
        pinLabels={{ pin1: "V_PLUS", pin2: "GND" }}
        schX={-6}
        schY={0}
      />
      <resistor
        name="R_SHUNT"
        resistance="10k"
        schX={-2}
        schY={-2}
        schRotation="90deg"
      />
      <resistor name="R_FILTER" resistance="1k" schX={2} schY={0} />
      <trace
        name="V-PLUS-INPUT"
        path={["J1.V_PLUS", "R_SHUNT.pin2", "R_FILTER.pin1"]}
        schDisplayLabel="V+"
      />
    </board>,
  )
  await pathTraceCircuit.renderUntilSettled()

  const pathTexts = pathTraceCircuit.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(pathTexts).toHaveLength(1)
  expect(pathTexts[0]?.source_trace_id).toBeTruthy()
  expect(
    pathTraceCircuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "V+"),
  ).toHaveLength(0)

  const { circuit: splitTraceCircuit } = getTestFixture()
  splitTraceCircuit.add(
    <board routingDisabled schMaxTraceDistance={10}>
      <group subcircuit name="MotorInput" schMaxTraceDistance={10}>
        <chip
          name="J1"
          pinLabels={{ pin1: "V_PLUS", pin2: "GND" }}
          schX={-6}
          schY={0}
        />
        <resistor
          name="R_SHUNT"
          resistance="10k"
          schX={-2}
          schY={-2}
          schRotation="90deg"
        />
        <resistor name="R_FILTER" resistance="1k" schX={2} schY={0} />
        <trace
          name="V-PLUS-INPUT"
          from=".J1 > .V_PLUS"
          to=".R_FILTER > .pin1"
          schDisplayLabel="V+"
        />
        <trace from=".R_SHUNT > .pin2" to=".R_FILTER > .pin1" />
      </group>
    </board>,
  )
  await splitTraceCircuit.renderUntilSettled()

  const displayedSourceTrace = splitTraceCircuit.db.source_trace
    .list()
    .find((trace) => trace.name === "V-PLUS-INPUT")
  expect(displayedSourceTrace).toBeDefined()

  const splitTexts = splitTraceCircuit.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(splitTexts).toHaveLength(1)
  expect(splitTexts[0]?.source_trace_id).toBe(
    displayedSourceTrace?.source_trace_id,
  )
  expect(
    splitTraceCircuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "V+"),
  ).toHaveLength(0)
})
