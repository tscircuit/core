import { expect, test } from "bun:test"
import { source_component_pins_underspecified_warning } from "circuit-json"
import type { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("partially specified chips get one warning with three pin examples", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "SUPPLY",
          pin2: "EMPTY",
          pin3: "COLOR_ONLY",
          pin4: "FALSE_ONLY",
          pin5: "MISSING",
          pin6: "NC",
          pin7: "INPUT",
          pin8: "GROUND",
        }}
        pinAttributes={{
          SUPPLY: { requiresPower: true },
          EMPTY: {},
          COLOR_ONLY: { highlightColor: "red" },
          FALSE_ONLY: { isInput: false, isOutput: false },
          INPUT: { isInput: true },
          GROUND: { requiresGround: true },
        }}
        noConnect={["NC"]}
      />
      <pcbnotetext
        text="U1: four incomplete pins; one warning, three examples"
        pcbY={-4}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  const warning = warnings[0]!
  expect(
    source_component_pins_underspecified_warning.safeParse(warning).success,
  ).toBe(true)
  expect(warning.message).toContain(
    "Chip U1 has pinAttributes issues affecting 4 pins",
  )
  expect(warning.message).toContain("EMPTY (missing electrical role")
  expect(warning.message).toContain("COLOR_ONLY (missing electrical role")
  expect(warning.message).toContain("FALSE_ONLY (missing electrical role")
  expect(warning.message).toContain("and 1 more")
  expect(warning.message).not.toContain("MISSING (")
  expect(warning.message).not.toContain("SUPPLY (")
  expect(warning.source_port_ids).toHaveLength(4)
  expect(warning.subcircuit_id).toBeDefined()
  expect(warning.message).not.toContain(warning.source_component_id)
  const chip = circuit.selectOne(".U1") as Chip<string>
  chip.doInitialSourceDesignRuleChecks()
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toEqual(warnings)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
