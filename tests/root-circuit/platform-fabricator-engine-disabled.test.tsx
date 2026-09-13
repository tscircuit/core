import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabricator checks require a preset and respect PCB and DRC disable flags", async () => {
  let calls = 0
  for (const config of [
    {
      platform: { drcChecksDisabled: true },
      preset: "jlcpcb_economy" as const,
    },
    { platform: { pcbDisabled: true }, preset: "jlcpcb_economy" as const },
    { platform: {}, preset: undefined },
  ]) {
    const { circuit } = getTestFixture({
      platform: {
        ...config.platform,
        fabricatorEngine: {
          runDrcChecks() {
            calls++
            return []
          },
        },
      },
    })
    circuit.add(
      <board width="10mm" height="10mm" fabricatorPreset={config.preset} />,
    )
    await circuit.renderUntilSettled()
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" fabricatorPreset="jlcpcb_economy" />,
  )
  await circuit.renderUntilSettled()
  expect(calls).toBe(0)
  expect(
    circuit
      .getCircuitJson()
      .filter(
        (element) => element.type === "pcb_fabricator_extra_charge_warning",
      ),
  ).toEqual([])
})
