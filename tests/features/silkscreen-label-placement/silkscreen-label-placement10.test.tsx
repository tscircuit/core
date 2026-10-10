import { expect, test } from "bun:test"
import type { PcbSilkscreenText } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("silkscreen labels inflated from a rendered layout stay where it put them", async () => {
  // Without a board, nothing moves R1's label off the hole beside it
  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <hole pcbX={0} pcbY={1.52} diameter="0.4mm" />
    </group>,
  )
  const renderedR1Label = subcircuitCircuitJson.find(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text" && element.text === "R1",
  )!

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="8mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={2.6}
        fontSize={0.4}
        text="R1 is inflated from a rendered layout: its label keeps that spot"
      />
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  expect(r1Label.anchor_position).toEqual(renderedR1Label.anchor_position)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
