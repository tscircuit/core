import { expect, spyOn, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NormalComponent_doInitialSourceDesignRuleChecks } from "lib/components/base-components/NormalComponent/NormalComponent_doInitialSourceDesignRuleChecks"

test("source DRC honors platform disable settings before collecting ports and traces", async () => {
  for (const platformDisabled of [undefined, true, false]) {
    const disabled = platformDisabled === true
    const { circuit } = getTestFixture({
      platform: { drcChecksDisabled: platformDisabled },
    })
    circuit.add(
      <board width="10mm" height="10mm" routingDisabled>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin2: "GND" }}
          pinAttributes={{ VCC: { requiresPower: true } }}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const warnings = circuit
      .getCircuitJson()
      .filter((entry) => entry.type === "source_pin_missing_trace_warning")
    expect(warnings).toHaveLength(disabled ? 0 : 1)

    // Check the phase in isolation: other phases may legitimately read traces.
    const chip = circuit.selectOne("chip") as Chip
    const selectPorts = spyOn(chip, "selectAll")
    try {
      NormalComponent_doInitialSourceDesignRuleChecks(chip)
      expect(selectPorts).toHaveBeenCalledTimes(disabled ? 0 : 1)
    } finally {
      selectPorts.mockRestore()
    }
  }
})
