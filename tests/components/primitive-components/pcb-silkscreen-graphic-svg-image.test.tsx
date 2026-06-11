import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import "lib/register-catalogue"

test("silkscreengraphic converts an SVG asset into pcb_silkscreen_graphic breps", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreengraphic
        imageUrl={`${staticAssetsServerUrl}/silkscreen-logo.svg`}
        width="12mm"
        height="8mm"
        pcbX={0}
        pcbY={0}
        layer="top"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const graphics = circuit.db.pcb_silkscreen_graphic.list()

  expect(graphics).toHaveLength(2)
  expect(graphics.every((graphic) => graphic.shape === "brep")).toBe(true)
  expect(
    graphics.some((graphic) => graphic.brep_shape.inner_rings.length === 1),
  ).toBe(true)

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
