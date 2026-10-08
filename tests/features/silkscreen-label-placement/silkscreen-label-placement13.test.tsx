import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a passive's label placed by hand isn't flipped off another part", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={-2.6}
        fontSize={0.4}
        text="R1's label is placed by hand over R2: it stays there"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={1}
        pcbY={-1}
        pcbSx={{ "& silkscreentext": { pcbX: 1.5, pcbY: 2.22 } }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={2.5}
        pcbY={1.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  expect(r1Label.anchor_position.x).toBeCloseTo(2.5)
  expect(r1Label.anchor_position.y).toBeCloseTo(1.22)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
