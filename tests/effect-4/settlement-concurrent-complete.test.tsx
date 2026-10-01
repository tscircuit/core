import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("overlapping callers each emit renderComplete with one metadata row", async () => {
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
  let completeEvents = 0
  circuit.on("renderComplete", () => {
    completeEvents++
  })
  const first = circuit.renderUntilSettled()
  const second = circuit.renderUntilSettled()
  releaseFootprint({ footprintCircuitJson: external0402Footprint })
  await Promise.all([first, second])
  expect(completeEvents).toBe(2)
  expect(circuit.db.source_project_metadata.list()).toHaveLength(1)
  expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
})
