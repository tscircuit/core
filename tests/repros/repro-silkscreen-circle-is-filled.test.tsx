import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreencircle isFilled draws a solid circle", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="8mm">
      <pcbnotetext text="isFilled" pcbX={-2.5} pcbY={2} fontSize={0.5} />
      <pcbnotetext text="default" pcbX={2.5} pcbY={2} fontSize={0.5} />
      <silkscreencircle pcbX={-2.5} pcbY={-0.5} radius={1.2} isFilled />
      <silkscreencircle pcbX={2.5} pcbY={-0.5} radius={1.2} />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const [filledCircle, outlineCircle] = circuit.db.pcb_silkscreen_circle.list()
  expect(filledCircle.is_filled).toBe(true)
  expect(outlineCircle.is_filled).toBe(false)
})
