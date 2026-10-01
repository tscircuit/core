import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net connectsTo accepts a string inside a subcircuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled schAutoLayoutEnabled>
      <subcircuit name="sensor">
        <resistor name="R1" resistance="1k" footprint="0805" />
        <net name="SIGNAL" connectsTo=".R1 > .pin1" />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()
  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toMatchObject([
    {
      connected_source_net_ids: [circuit.db.source_net.list()[0].source_net_id],
      connected_source_port_ids: [
        circuit.db.source_port.list()[0].source_port_id,
      ],
    },
  ])
})
