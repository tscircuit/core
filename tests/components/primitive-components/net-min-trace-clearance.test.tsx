import { expect, test } from "bun:test"
import { source_net } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net trace clearance survives rendering and JSON serialization", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled schematicDisabled>
      <net name="USB" minTraceClearance="0.15mm" />
      <net name="RF" minTraceClearance={0.22} />
      <net name="MIL" minTraceClearance="10mil" />
      <net name="ZERO" minTraceClearance={0} />
      <net name="DEFAULT" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const sourceNets = circuit.db.source_net.list()
  expect(sourceNets).toHaveLength(5)
  expect(
    sourceNets.find((net) => net.name === "USB")?.min_trace_clearance,
  ).toBe(0.15)
  expect(sourceNets.find((net) => net.name === "RF")?.min_trace_clearance).toBe(
    0.22,
  )
  expect(
    sourceNets.find((net) => net.name === "MIL")?.min_trace_clearance,
  ).toBe(0.254)
  expect(
    sourceNets.find((net) => net.name === "ZERO")?.min_trace_clearance,
  ).toBe(0)
  expect(sourceNets.find((net) => net.name === "DEFAULT")).not.toHaveProperty(
    "min_trace_clearance",
  )
  const serializedNets = JSON.parse(JSON.stringify(sourceNets)).map(
    (net: unknown) => source_net.parse(net),
  )
  expect(serializedNets).toEqual(sourceNets)
})
