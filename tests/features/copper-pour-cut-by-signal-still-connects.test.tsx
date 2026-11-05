import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a signal that cuts a pour does not leave the ground pads open", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="24mm">
      <pcbnotetext
        text="The signal cuts the narrow neck of the GND pour"
        pcbY={9.2}
        fontSize={0.45}
      />
      <pcbnotetext
        text="A trace still joins the two islands, so neither pad is left open"
        pcbY={8}
        fontSize={0.45}
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
      <testpoint
        name="S1"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={0}
        pcbY={5}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <testpoint
        name="S2"
        footprintVariant="pad"
        padDiameter={2}
        pcbX={0}
        pcbY={-5}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <silkscreentext text="A" pcbX={-8} pcbY={-1.8} fontSize={0.7} />
      <silkscreentext text="B" pcbX={8} pcbY={-1.8} fontSize={0.7} />
      <silkscreentext text="S1" pcbX={1.6} pcbY={5} fontSize={0.7} />
      <silkscreentext text="S2" pcbX={1.6} pcbY={-5} fontSize={0.7} />
      <trace from="A.pin1" to="net.GND" />
      <trace from="B.pin1" to="net.GND" />
      <trace from="S1.pin1" to="S2.pin1" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        clearance="0.25mm"
        outline={[
          { x: -11, y: -2 },
          { x: -2, y: -2 },
          { x: -2, y: -0.2 },
          { x: 2, y: -0.2 },
          { x: 2, y: -2 },
          { x: 11, y: -2 },
          { x: 11, y: 2 },
          { x: 2, y: 2 },
          { x: 2, y: 0.2 },
          { x: -2, y: 0.2 },
          { x: -2, y: 2 },
          { x: -11, y: 2 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
