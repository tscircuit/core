import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pads on opposite sides of a split pour still get a route", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="28mm" height="16mm">
      <pcbnotetext
        text="The top keepout splits the GND pour into two islands"
        pcbY={5.6}
        fontSize={0.42}
      />
      <pcbnotetext
        text="The route crosses the gap on the bottom"
        pcbY={4.5}
        fontSize={0.42}
      />
      <testpoint
        name="A"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={-8}
        pcbY={0}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <testpoint
        name="B"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={8}
        pcbY={0}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <silkscreentext text="A" pcbX={-8} pcbY={-2.2} fontSize={0.8} />
      <silkscreentext text="B" pcbX={8} pcbY={-2.2} fontSize={0.8} />
      <trace from="A.pin1" to="net.GND" />
      <trace from="B.pin1" to="net.GND" />
      <keepout shape="rect" layer="top" width="4mm" height="16mm" />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
