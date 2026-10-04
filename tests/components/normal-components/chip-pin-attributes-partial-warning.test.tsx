import { expect, test } from "bun:test"
import { source_component_pins_underspecified_warning } from "circuit-json"
import type { Chip } from "lib/components/normal-components/Chip"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("partially specified chips get one warning with three pin examples", async () => {
  const { circuit } = getTestFixture()
  const pinAttributes = {
    SUPPLY: { requiresPower: true },
    EMPTY: {},
    COLOR_ONLY: { highlightColor: "red" },
    FALSE_ONLY: { isInput: false, isOutput: false },
    INPUT: { isInput: true },
    GROUND: { requiresGround: true },
  }
  const codeLines = [
    "pinAttributes={{",
    ...Object.entries(pinAttributes).map(
      ([pin, attributes]) =>
        `  ${pin}: ${JSON.stringify(attributes).replaceAll(":", ": ").replaceAll(",", ", ")},`,
    ),
    "}}",
    'noConnect={["NC"]}',
    "// MISSING has no entry",
  ]
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        schX={-5}
        schY={1.5}
        schWidth={3}
        schHeight={3}
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
        pinAttributes={pinAttributes}
        noConnect={["NC"]}
      />
      <schematictext
        text="Incomplete pinAttributes: one warning for the chip"
        schX={0}
        schY={4.5}
        anchor="center"
        fontSize={0.3}
      />
      {codeLines.map((text, line) => (
        <Fragment key={text}>
          <schematictext
            text={text}
            schX={-1}
            schY={3.4 - line * 0.32}
            anchor="left"
            fontSize={0.22}
          />
        </Fragment>
      ))}
      {[
        "EMPTY is empty; COLOR_ONLY has no electrical role.",
        "FALSE_ONLY enables no role; MISSING is omitted.",
        "Four affected pins share ONE warning: THREE examples + 'and 1 more'.",
        "SUPPLY, INPUT, GROUND and the intentional NC pin are valid.",
      ].map((text, line) => (
        <Fragment key={text}>
          <schematictext
            text={text}
            schX={0}
            schY={-0.8 - line * 0.35}
            anchor="center"
            fontSize={0.22}
          />
        </Fragment>
      ))}
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
  const warningLines = warning.message.match(/.{1,70}(?:\s|$)/g)!
  for (const [line, text] of [
    "Actual generated warning (1 record):",
    ...warningLines,
  ].entries()) {
    circuit.db.schematic_text.insert({
      text: text.trim(),
      position: { x: 0, y: -2.6 - line * 0.35 },
      anchor: "center",
      font_size: 0.22,
      rotation: 0,
      color: "#9a3412",
    })
  }
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1200,
    height: 750,
    css: ".sch-text { white-space: pre; }",
  })
})
