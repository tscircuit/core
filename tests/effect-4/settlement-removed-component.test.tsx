import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("caller abort leaves jobs running but removed components reject late footprint commits", async () => {
  let releaseFootprint!: (result: {
    footprintCircuitJson: typeof external0402Footprint
  }) => void
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
      footprintLibraryMap: {
        custom: () =>
          new Promise((resolve) => {
            releaseFootprint = resolve
          }),
      },
    },
  })
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="custom:R_0402" />
    </board>,
  )
  const controller = new AbortController()
  const settled = circuit
    .renderUntilSettled({ signal: controller.signal })
    .catch((error: unknown) => error)
  const resistor = circuit.selectOne("resistor")!
  const childrenBeforeRemoval = resistor.children.length
  resistor.shouldBeRemoved = true
  controller.abort()
  expect(await settled).toBe(controller.signal.reason)
  releaseFootprint({ footprintCircuitJson: external0402Footprint })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(resistor.children.length).toBe(childrenBeforeRemoval)
  expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
  expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
})
