import { expect, test } from "bun:test"
import lm251772FilledSilkscreen from "../assets/lm251772evm-pd-filled-silkscreen.svg"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Uses the exact filled regions 2098, 2100, and 2101 from LM251772EVM-PD.
test("LM251772EVM-PD filled silkscreen stays fill-only", async () => {
  const { circuit } = getTestFixture()
  const silkscreenSvg = await Bun.file(lm251772FilledSilkscreen).text()
  const silkscreenDataUrl = `data:image/svg+xml,${encodeURIComponent(silkscreenSvg)}`

  circuit.add(
    <board width="8mm" height="11mm">
      <pcbnotetext pcbY={4.7} fontSize={0.42} text="FIXED: FILL ONLY" />
      <silkscreengraphic
        imageUrl={silkscreenDataUrl}
        pcbY={-0.45}
        width="4.94951258mm"
        height="7.02767454mm"
        layer="top"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const filledGraphics = circuit.db.pcb_silkscreen_graphic.list()
  const duplicateContours = circuit.db.pcb_silkscreen_path.list()
  expect(filledGraphics).toHaveLength(3)
  expect(duplicateContours).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
