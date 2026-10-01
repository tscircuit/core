import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a finished JSX circuit keeps eager completion and caller microtask ordering", async () => {
  const { circuit } = getTestFixture({
    platform: { routingDisabled: true, drcChecksDisabled: true },
  })
  circuit.add(<board width={10} height={10} />)
  const events: string[] = []
  circuit.on("renderComplete", () => events.push("render_complete"))

  const settled = circuit.renderUntilSettled().then(() => {
    events.push("settled")
  })
  events.push("returned")
  queueMicrotask(() => events.push("caller_microtask"))
  await settled

  expect(events).toEqual([
    "render_complete",
    "returned",
    "settled",
    "caller_microtask",
  ])
  expect(
    circuit.getCircuitJson().filter((element) => element.type === "pcb_board"),
  ).toHaveLength(1)
})
