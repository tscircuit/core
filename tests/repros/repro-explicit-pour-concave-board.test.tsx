import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("clipping splits pours without losing their net ownership", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      outline={[
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
        { x: 2, y: 5 },
        { x: 2, y: -2 },
        { x: -2, y: -2 },
        { x: -2, y: 5 },
        { x: -5, y: 5 },
      ]}
      routingDisabled
    >
      <net name="GND" />
      <net name="VCC" />
      <net name="OUTSIDE" />
      <copperpour
        layer="bottom"
        connectsTo="net.OUTSIDE"
        outline={[
          { x: 10, y: 10 },
          { x: 12, y: 10 },
          { x: 12, y: 12 },
          { x: 10, y: 12 },
        ]}
      />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        boardEdgeMargin={0.3}
        outline={[
          { x: -8, y: 0 },
          { x: 8, y: 0 },
          { x: 8, y: 8 },
          { x: -8, y: 8 },
        ]}
      />
      <copperpour
        layer="bottom"
        connectsTo="net.VCC"
        outline={[
          { x: -4, y: -4 },
          { x: -3, y: -4 },
          { x: -3, y: -3 },
          { x: -4, y: -3 },
        ]}
      />
      <pcbnotetext
        text="GND region splits into two islands"
        pcbY={-2.8}
        fontSize={0.3}
      />
      <pcbnotetext
        text="Small VCC island retained; outside pour omitted"
        pcbY={-4.5}
        fontSize={0.23}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(3)
  for (const [netName, expectedCount] of [
    ["GND", 2],
    ["VCC", 1],
    ["OUTSIDE", 0],
  ] as const) {
    const net = circuit.db.source_net
      .list()
      .find((net) => net.name === netName)!
    expect(
      pours.filter((pour) => pour.source_net_id === net.source_net_id),
    ).toHaveLength(expectedCount)
  }
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    showErrorsInTextOverlay: true,
  })
})
