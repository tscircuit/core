import { expect, test } from "bun:test"
import type { SourceTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("only isolated breakout ports need source stubs before PCB rendering", async () => {
  const { circuit } = getTestFixture()
  let sourceTracesBeforePcb: SourceTrace[] = []
  circuit.on("board:renderPhaseStarted", ({ phase }) => {
    if (phase === "PcbPrimitiveRender") {
      sourceTracesBeforePcb = structuredClone(circuit.db.source_trace.list())
    }
  })
  circuit.add(
    <board width={10} height={8} routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <breakoutpoint connection="R1.pin1" pcbX={3} />
      <breakoutpoint connection="R1.pin2" pcbX={3} pcbY={1} />
      <trace from="R1.pin2" to="R2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(sourceTracesBeforePcb).toHaveLength(2)
  expect(circuit.db.source_trace.list()).toEqual(sourceTracesBeforePcb)
  await circuit.renderUntilSettled()
  expect(circuit.db.source_trace.list()).toEqual(sourceTracesBeforePcb)
})
