import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: parsing keyed intrinsic elements reads React's reserved key prop", async () => {
  const { circuit } = getTestFixture()
  const consoleWarn = spyOn(console, "warn").mockImplementation(() => {})
  const consoleError = spyOn(console, "error").mockImplementation(() => {})
  let capturedConsoleCalls: unknown[][] = []

  try {
    circuit.add(
      <board width="12mm" height="8mm">
        {[0, 1].map((phaseIndex) => (
          <autoroutingphase
            key={`routing-phase-${phaseIndex}`}
            phaseIndex={phaseIndex}
          />
        ))}
      </board>,
    )
    await circuit.renderUntilSettled()
    await new Promise((resolve) => setTimeout(resolve, 10))
    capturedConsoleCalls = [
      ...consoleWarn.mock.calls.map((call) => [...call]),
      ...consoleError.mock.calls.map((call) => [...call]),
    ]
  } finally {
    consoleWarn.mockRestore()
    consoleError.mockRestore()
  }

  const keyWarnings = capturedConsoleCalls.filter((call) =>
    call.some(
      (argument) =>
        typeof argument === "string" &&
        argument.includes("`key` is not a prop"),
    ),
  )
  expect(keyWarnings.length).toBeGreaterThan(0)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="230" viewBox="0 0 820 230">
    <rect width="820" height="230" fill="#111827" />
    <text x="410" y="42" text-anchor="middle" fill="#f9fafb" font-family="Arial" font-size="24" font-weight="700">React key/schema reproduction</text>
    <rect x="40" y="72" width="740" height="116" rx="10" fill="#450a0a" stroke="#ef4444" stroke-width="2" />
    <text x="68" y="108" fill="#fecaca" font-family="Arial" font-size="18">Reserved key warnings: ${keyWarnings.length}</text>
    <text x="68" y="139" fill="#fecaca" font-family="Arial" font-size="18">Zod asks React props for key even though React never exposes it.</text>
    <text x="68" y="168" fill="#fecaca" font-family="Arial" font-size="18">Mapped autoroutingphase elements therefore emit a runtime warning.</text>
  </svg>`
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
