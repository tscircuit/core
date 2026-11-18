import { expect, test } from "bun:test"
import { source_net } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net trace clearance survives rendering and JSON serialization", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={12} routingDisabled schematicDisabled>
      <net name="USB" minTraceClearance="0.15mm" connectsTo="J1.pin1" />
      <net name="RF" minTraceClearance={0.22} connectsTo="J1.pin2" />
      <net name="MIL" minTraceClearance="10mil" connectsTo="J1.pin3" />
      <net name="ZERO" minTraceClearance={0} connectsTo="J1.pin4" />
      <net name="DEFAULT" connectsTo="J1.pin5" />
      <pinheader
        name="J1"
        pinCount={5}
        pinLabels={{
          pin1: "USB",
          pin2: "RF",
          pin3: "MIL",
          pin4: "ZERO",
          pin5: "DEFAULT",
        }}
      />
      <pcbnotetext
        pcbY={4}
        fontSize={0.4}
        text="USB 0.15 | RF 0.22 | MIL 0.254 mm"
      />
      <pcbnotetext
        pcbY={-4}
        fontSize={0.4}
        text="ZERO 0 | DEFAULT: board minimum"
      />
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
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
