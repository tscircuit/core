import { expect, test } from "bun:test"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint end observers finish before settlement rerenders and its Promise resolves", async () => {
  let releaseFootprint!: (result: {
    footprintCircuitJson: typeof external0402Footprint
  }) => void
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
      drcChecksDisabled: true,
      footprintLibraryMap: {
        custom: () =>
          new Promise((resolve) => {
            releaseFootprint = resolve
          }),
      },
    },
  })
  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" resistance="10k" footprint="custom:R_0402" />
    </board>,
  )
  const events: string[] = []
  const render = circuit.render.bind(circuit)
  circuit.render = () => {
    events.push("render")
    render()
  }
  circuit.on("renderComplete", () => events.push("render_complete"))
  const settled = circuit.renderUntilSettled().then(() => {
    events.push("settled")
  })
  expect(events).toEqual(["render"])

  // The waiter subscribes first. This later observer detects synchronous re-entry.
  circuit.on("asyncEffect:end", (event: { effectName: string }) => {
    if (event.effectName !== "load-lib-footprint") return
    events.push("footprint_end")
    expect(events).toEqual(["render", "footprint_end"])
    queueMicrotask(() => events.push("observer_microtask"))
  })
  releaseFootprint({ footprintCircuitJson: external0402Footprint })
  await settled

  expect(events).toEqual([
    "render",
    "footprint_end",
    "render",
    "render_complete",
    "observer_microtask",
    "settled",
  ])
  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((element) => element.type === "pcb_smtpad"),
  ).toHaveLength(2)
  expect(
    circuitJson.filter(
      (element) => element.type === "source_component" && element.name === "R1",
    ),
  ).toHaveLength(1)
})
