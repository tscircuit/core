import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.skip("repro for routing failure", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor
        name="R1"
        footprint={
          <footprint>
            <smtpad shape="rect" pcbX={0} pcbY={0} width={0.3} height={0.3} />
            <smtpad shape="rect" pcbX={0.6} pcbY={0} width={0.3} height={0.3} />
          </footprint>
        }
        resistance="10kohm"
      />
      <capacitor
        name="C1"
        footprint={
          <footprint>
            <smtpad shape="rect" pcbX={0} pcbY={0} width={0.3} height={0.3} />
            <smtpad shape="rect" pcbX={0.6} pcbY={0} width={0.3} height={0.3} />
          </footprint>
        }
        capacitance="10uF"
      />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcb_trace = circuitJson.filter((el) => el.type === "pcb_trace")
  expect(pcb_trace).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
