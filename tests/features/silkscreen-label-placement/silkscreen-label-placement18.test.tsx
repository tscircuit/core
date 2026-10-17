import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a clear label turned upside down or reading from the left edge is turned readable", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={2.6}
        fontSize={0.4}
        text="Nothing covers the default labels, which are turned with their parts"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbRotation={180}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbRotation={270}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={3}
        pcbRotation={90}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const getLabel = (name: string) =>
    circuit.db.pcb_silkscreen_text.list().find((text) => text.text === name)!
  // Top text reads from the bottom or the right edge; bottom text is mirrored
  expect([0, 90]).toContain(getLabel("R1").ccw_rotation!)
  expect([0, 90]).toContain(getLabel("R2").ccw_rotation!)
  expect([0, 270]).toContain(getLabel("R3").ccw_rotation!)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
