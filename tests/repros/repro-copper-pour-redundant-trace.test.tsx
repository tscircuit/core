import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a ground pour does not get a trace between pads it already joins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="32mm" height="18mm">
      <pcbnotetext
        text="A and B are connected by the top GND pour"
        pcbY={6.4}
        fontSize={0.48}
      />
      <pcbnotetext
        text="No trace is drawn between A and B"
        pcbY={5.2}
        fontSize={0.48}
      />
      <pcbnotetext
        text="C is outside the pour and still needs a trace"
        pcbY={4}
        fontSize={0.48}
      />
      <testpoint
        name="A"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={-10}
        pcbY={-1}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <testpoint
        name="B"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={-4}
        pcbY={-1}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <testpoint
        name="C"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={8}
        pcbY={-1}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <silkscreentext text="A" pcbX={-10} pcbY={-2.6} fontSize={0.8} />
      <silkscreentext text="B" pcbX={-4} pcbY={-2.6} fontSize={0.8} />
      <silkscreentext text="C" pcbX={8} pcbY={-2.6} fontSize={0.8} />
      <trace from="A.pin1" to="net.GND" />
      <trace from="B.pin1" to="net.GND" />
      <trace from="C.pin1" to="net.GND" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -13, y: -0.7 },
          { x: -1.5, y: -0.7 },
          { x: -1.5, y: 2.6 },
          { x: -13, y: 2.6 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
