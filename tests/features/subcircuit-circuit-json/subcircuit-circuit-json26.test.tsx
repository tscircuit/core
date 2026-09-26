import { expect, test } from "bun:test"
import type { PcbSilkscreenText, PcbSmtPadRotatedPill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("inflated PCB primitives preserve rotation and silkscreen layer", async () => {
  const renderedCircuitJson = await renderToCircuitJson(
    <board width="20mm" height="16mm">
      <chip
        name="U1"
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              shape="rotated_pill"
              width="1.8mm"
              height="0.6mm"
              radius="0.3mm"
              ccwRotation={25}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <silkscreentext
        text="BACK"
        layer="bottom"
        pcbX={4}
        pcbY={3}
        pcbRotation={180}
      />
    </board>,
  )
  const originalPad = renderedCircuitJson.find(
    (element): element is PcbSmtPadRotatedPill =>
      element.type === "pcb_smtpad" && element.shape === "rotated_pill",
  )
  const originalText = renderedCircuitJson.find(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text" && element.text === "BACK",
  )
  const { circuit } = getTestFixture()
  circuit.add(<board circuitJson={renderedCircuitJson} />)

  await circuit.renderUntilSettled()

  const inflatedPad = circuit.db.pcb_smtpad
    .list()
    .find((pad) => pad.shape === "rotated_pill")
  const inflatedText = circuit.db.pcb_silkscreen_text.getWhere({ text: "BACK" })
  expect(inflatedPad).toMatchObject({
    shape: "rotated_pill",
    ccw_rotation: originalPad?.ccw_rotation,
    width: originalPad?.width,
    height: originalPad?.height,
  })
  expect(inflatedText).toMatchObject({
    layer: "bottom",
    ccw_rotation: originalText?.ccw_rotation,
    font_size: originalText?.font_size,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
