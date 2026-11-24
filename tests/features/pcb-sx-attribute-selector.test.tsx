import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbSx single-segment attribute selector matches component props", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="30mm"
      height="20mm"
      pcbSx={{
        "& silkscreentext[text='LOCAL']": {
          fontSize: "2.5mm",
        },
      }}
    >
      <silkscreentext text="LOCAL" pcbX={-5} pcbY={0} />
      <silkscreentext text="OTHER" pcbX={5} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const localText = silkscreenTexts.find((text) => text.text === "LOCAL")
  const otherText = silkscreenTexts.find((text) => text.text === "OTHER")

  expect(localText?.font_size).toBe(2.5)
  expect(otherText?.font_size).toBe(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
