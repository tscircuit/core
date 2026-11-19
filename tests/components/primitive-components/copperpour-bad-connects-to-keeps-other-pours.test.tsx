import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a pour with an unresolvable connectsTo does not remove the board's other pours", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <net name="GND" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -4, y: -2 },
          { x: 0, y: -2 },
          { x: 0, y: 2 },
          { x: -4, y: 2 },
        ]}
      />
      <subcircuit name="child" routingDisabled>
        <copperpour
          connectsTo=".NOPE > .pin1"
          layer="top"
          outline={[
            { x: 1, y: -2 },
            { x: 4, y: -2 },
            { x: 4, y: 2 },
            { x: 1, y: 2 },
          ]}
        />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  const gndNet = circuit.db.source_net.list().find((n) => n.name === "GND")!
  expect(
    circuit.db.pcb_copper_pour
      .list()
      .filter((pour) => pour.source_net_id === gndNet.source_net_id),
  ).toHaveLength(1)
})
