import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("asyncEffect:end observers finish before the settlement loop renders again", async () => {
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
  let renderCalls = 0
  circuit.render = () => {
    renderCalls++
    render()
  }
  const settled = circuit.renderUntilSettled()
  const callsAtFootprintEnd: number[] = []
  // Subscribe after the waiter so it observes any synchronous re-entry.
  circuit.on("asyncEffect:end", (event: { effectName: string }) => {
    if (event.effectName === "load-lib-footprint")
      callsAtFootprintEnd.push(renderCalls)
  })
  releaseFootprint({ footprintCircuitJson: external0402Footprint })
  await settled
  expect(callsAtFootprintEnd).toEqual([1])
})
