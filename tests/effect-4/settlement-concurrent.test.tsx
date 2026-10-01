import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("aborting one caller leaves the other caller and external observers active", async () => {
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
  let endEvents = 0
  let completeEvents = 0
  circuit.on("asyncEffect:end", (event: { effectName: string }) => {
    if (event.effectName === "load-lib-footprint") endEvents++
  })
  circuit.on("renderComplete", () => {
    completeEvents++
  })
  const controller = new AbortController()
  const first = circuit
    .renderUntilSettled({ signal: controller.signal })
    .catch((error: unknown) => error)
  const second = circuit.renderUntilSettled()
  controller.abort()
  try {
    expect(await first).toBe(controller.signal.reason)
    expect(circuit._eventListeners["asyncEffect:end"]).toHaveLength(2)
  } finally {
    releaseFootprint({ footprintCircuitJson: external0402Footprint })
  }
  await second
  expect(endEvents).toBe(1)
  expect(completeEvents).toBe(1)
  expect(circuit._eventListeners["asyncEffect:end"]).toHaveLength(1)
  expect(circuit.db.source_project_metadata.list()).toHaveLength(1)
})
