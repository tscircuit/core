import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported net clearance survives subcircuit inflation", async () => {
  const sourceJson: CircuitJson = [
    {
      type: "source_net",
      source_net_id: "source_net_usb",
      name: "USB",
      member_source_group_ids: [],
      min_trace_clearance: 0.15,
    },
    {
      type: "source_net",
      source_net_id: "source_net_zero",
      name: "ZERO",
      member_source_group_ids: [],
      min_trace_clearance: 0,
    },
    {
      type: "source_net",
      source_net_id: "source_net_default",
      name: "DEFAULT",
      member_source_group_ids: [],
    },
  ]
  const originalJson = structuredClone(sourceJson)
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled schematicDisabled>
      <subcircuit name="Imported" circuitJson={sourceJson} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const sourceNets = circuit.db.source_net.list()
  expect(sourceNets).toHaveLength(3)
  expect(
    sourceNets.find((net) => net.name === "USB")?.min_trace_clearance,
  ).toBe(0.15)
  expect(
    sourceNets.find((net) => net.name === "ZERO")?.min_trace_clearance,
  ).toBe(0)
  expect(sourceNets.find((net) => net.name === "DEFAULT")).not.toHaveProperty(
    "min_trace_clearance",
  )
  expect(sourceJson).toEqual(originalJson)
})
