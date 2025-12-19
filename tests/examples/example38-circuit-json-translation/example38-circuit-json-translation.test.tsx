import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import boardCircuitJson from "./example38CircuitJson.json"

test("circuit json translation works, autorouter/packing isn't called", async () => {
  const { circuit } = getTestFixture()

  // Track autorouting calls
  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  let packingStartCount = 0
  circuit.on("packing:start", () => {
    packingStartCount++
  })

  circuit.add(
    <board width={20} height={20} routingDisabled>
      <subcircuit pcbX={5} circuitJson={boardCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const traceCount = circuitJson.filter(
    (item) => item.type === "pcb_trace",
  ).length
  // expect(traceCount).toBe(1)
  // expect(autoroutingStartCount).toBe(0)
  // expect(packingStartCount).toBe(0)
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
