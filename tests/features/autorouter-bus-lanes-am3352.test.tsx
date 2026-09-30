import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from "tests/fixtures/am3352-ram-bus-lanes"

test("bus_lanes routes AM3352 DDR3 from original pads without a custom algorithm", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(json.filter((e) => e.type.endsWith("_error"))).toEqual([])
  expect(json.filter((e) => e.type === "source_trace")).toHaveLength(47)
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(47)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 180_000)
