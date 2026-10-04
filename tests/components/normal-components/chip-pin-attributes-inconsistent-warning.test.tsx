import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("contradictory electrical attributes are summarized once per chip", async () => {
  const { circuit } = getTestFixture()
  const pinAttributes = {
    NC: { doNotConnect: true, mustBeConnected: true },
    GROUND: { requiresGround: true, requiresVoltage: "3.3V" },
    DATA: { isOutput: true, isUsingOpenDrain: true, canUseOpenDrain: false },
  }
  const codeLines = [
    "pinAttributes={{",
    "  NC: " +
      JSON.stringify(pinAttributes.NC)
        .replaceAll(":", ": ")
        .replaceAll(",", ", ") +
      ",",
    "  GROUND: " +
      JSON.stringify(pinAttributes.GROUND)
        .replaceAll(":", ": ")
        .replaceAll(",", ", ") +
      ",",
    "  DATA: { isOutput: true,",
    "    isUsingOpenDrain: true, canUseOpenDrain: false },",
    "}}",
  ]
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="pinrow3"
        schX={-5}
        schY={1.5}
        schWidth={3}
        schHeight={2}
        pinLabels={{ pin1: "NC", pin2: "GROUND", pin3: "DATA" }}
        pinAttributes={pinAttributes}
      />
      <schematictext
        text="Inconsistent pinAttributes: three issues, one chip warning"
        schX={0}
        schY={4}
        anchor="center"
        fontSize={0.3}
      />
      {codeLines.map((text, line) => (
        <Fragment key={text}>
          <schematictext
            text={text}
            schX={-1}
            schY={3 - line * 0.35}
            anchor="left"
            fontSize={0.22}
          />
        </Fragment>
      ))}
      {[
        "NC cannot both prohibit and require a connection.",
        "GROUND declares a nonzero voltage.",
        "DATA enables an explicitly unsupported output mode.",
        "The checker summarizes all three affected pins in ONE warning for U1.",
      ].map((text, line) => (
        <Fragment key={text}>
          <schematictext
            text={text}
            schX={0}
            schY={-0.4 - line * 0.35}
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
  expect(warnings[0]!.message).toContain(
    "NC (doNotConnect conflicts with mustBeConnected)",
  )
  expect(warnings[0]!.message).toContain(
    "GROUND (ground pin declares a nonzero voltage)",
  )
  expect(warnings[0]!.message).toContain(
    "DATA (isUsingOpenDrain conflicts with canUseOpenDrain: false)",
  )
  expect(warnings[0]!.source_port_ids).toHaveLength(3)
  const warningLines = warnings[0]!.message.match(/.{1,70}(?:\s|$)/g)!
  for (const [line, text] of [
    "Actual generated warning (1 record):",
    ...warningLines,
  ].entries()) {
    circuit.db.schematic_text.insert({
      text: text.trim(),
      position: { x: 0, y: -2.2 - line * 0.35 },
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
