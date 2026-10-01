import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("a render error after async completion rejects by identity with no leaked waiter", async () => {
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
  const render = circuit.render.bind(circuit)
  const failure = new Error("later render failed")
  let renderCalls = 0
  circuit.render = () => {
    if (renderCalls++ > 0) throw failure
    render()
  }
  const settled = circuit.renderUntilSettled()
  releaseFootprint({ footprintCircuitJson: external0402Footprint })
  expect(await settled.catch((error: unknown) => error)).toBe(failure)
  expect(renderCalls).toBe(2)
  expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
})
