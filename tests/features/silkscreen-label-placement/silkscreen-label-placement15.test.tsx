import { expect, test } from "bun:test"
import { Resistor } from "lib/components/normal-components/Resistor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a part whose label is placed by hand, added after the first render, gets the other labels placed again", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={2.6}
        fontSize={0.4}
        text="R2, whose label is placed by hand on R1's, is added after the first render: R1's label moves"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const getR1LabelPosition = () =>
    circuit.db.pcb_silkscreen_text.list().find((text) => text.text === "R1")!
      .anchor_position
  // An 0402's default label is centered 1.22 mm above the part
  expect(getR1LabelPosition()).toEqual({ x: 0, y: 1.22 })

  circuit.firstChild!.add(
    new Resistor({
      name: "R2",
      resistance: "1k",
      footprint: "0402",
      pcbX: -2,
      pcbY: -1.5,
      pcbSx: { "& silkscreentext": { pcbX: 2, pcbY: 2.72 } },
    }),
  )
  await circuit.renderUntilSettled()

  const { x, y } = getR1LabelPosition()
  expect(Math.hypot(x, y - 1.22)).toBeGreaterThan(0.1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
