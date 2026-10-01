import { expect, jest, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("untracked pending work retains the 100ms fallback under fake timers", async () => {
  const { circuit } = getTestFixture()
  let renderCalls = 0
  circuit.render = () => {
    renderCalls++
  }
  circuit.isDoneRendering = () => renderCalls >= 2
  jest.useFakeTimers()
  try {
    const settled = circuit.renderUntilSettled()
    expect(renderCalls).toBe(1)
    jest.advanceTimersByTime(100)
    await settled
    expect(renderCalls).toBe(2)
    expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
    expect(jest.getTimerCount()).toBe(0)
  } finally {
    jest.useRealTimers()
  }
})
