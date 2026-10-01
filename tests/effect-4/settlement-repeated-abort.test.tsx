import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("repeated aborted waits do not accumulate listeners or lose the pending job", async () => {
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
  for (let attempt = 0; attempt < 25; attempt++) {
    const controller = new AbortController()
    const settled = circuit
      .renderUntilSettled({ signal: controller.signal })
      .catch((error: unknown) => error)
    controller.abort()
    expect(await settled).toBe(controller.signal.reason)
    expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(1)
  }
  releaseFootprint({ footprintCircuitJson: external0402Footprint })
  await circuit.renderUntilSettled()
  expect(circuit.isDoneRendering()).toBe(true)
  expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
})
