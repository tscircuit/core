import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connected net rules survive importing the same circuit twice", async () => {
  const { circuit: original } = getTestFixture()
  original.add(
    <board width={8} height={6} routingDisabled schematicDisabled>
      <net
        name="USB"
        minTraceClearance="0.15mm"
        nominalTraceWidth="0.3mm"
        connectsTo="R1.pin1"
      />
      <net name="GND" minTraceClearance={0} connectsTo="R1.pin2" />
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await original.renderUntilSettled()
  const sourceJson = original.getCircuitJson()
  const originalJson = structuredClone(sourceJson)

  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled schematicDisabled>
      <subcircuit name="LEFT" circuitJson={sourceJson} pcbX={-5} />
      <subcircuit name="RIGHT" circuitJson={sourceJson} pcbX={5} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const usbNets = circuit.db.source_net
    .list()
    .filter((net) => net.name === "USB")
  expect(usbNets).toHaveLength(2)
  expect(usbNets[0]).toMatchObject({
    min_trace_clearance: 0.15,
    trace_width: 0.3,
  })
  expect(usbNets[1]).toMatchObject({
    min_trace_clearance: 0.15,
    trace_width: 0.3,
  })
  expect(usbNets[0].subcircuit_id).not.toBe(usbNets[1].subcircuit_id)
  expect(
    circuit.db.source_net.list().filter((net) => net.name === "GND"),
  ).toMatchObject([
    { min_trace_clearance: 0, is_ground: true },
    { min_trace_clearance: 0, is_ground: true },
  ])
  expect(circuit.db.source_net.list()).toHaveLength(4)
  expect(circuit.db.source_trace.list()).toHaveLength(4)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(sourceJson).toEqual(originalJson)
})
