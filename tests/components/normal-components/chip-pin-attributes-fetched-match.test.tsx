import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("matching declarations and omitted attributes inherit fetched facts without a mismatch warning", async () => {
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{ VDD: { requiresVoltage: "3300mV" } }}
        schX={0}
        schY={0}
        schWidth={2.4}
        schHeight={1.4}
      />
      <schematictext
        text="Matching declarations: NO fetched-metadata mismatch"
        schX={0}
        schY={4}
        anchor="center"
        fontSize={0.3}
      />
      {[
        {
          x: -3.8,
          lines: [
            "FETCHED source_port facts",
            "VDD: requires_power: true",
            "VDD: requires_voltage: 3.3",
            "GND: requires_ground: true",
            "GND: requires_voltage: 0",
          ],
        },
        {
          x: 3.8,
          lines: [
            "USER declaration",
            "pinAttributes={{",
            'VDD: { requiresVoltage: "3300mV" }',
            "}}",
            "// GND is omitted",
          ],
        },
      ].flatMap(({ x, lines }) =>
        lines.map((text, line) => (
          <Fragment key={`${x}-${line}`}>
            <schematictext
              text={text}
              schX={x}
              schY={3.1 - line * 0.4}
              anchor="center"
              fontSize={0.22}
            />
          </Fragment>
        )),
      )}
      {[
        "3300mV is normalized to 3.3V, so the explicit voltage agrees with the fetched value.",
        "Omitted VDD power and GND attributes inherit the fetched facts; they are not mismatches.",
        "Actual result: 0 pin-metadata warnings. VDD = 3.3V; GND = 0V.",
        "When no fetched pin facts are available, this comparison cannot verify the configuration.",
      ].map((text, line) => (
        <Fragment key={text}>
          <schematictext
            text={text}
            schX={0}
            schY={-1.4 - line * 0.4}
            anchor="center"
            fontSize={0.22}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
  const ports = circuit.db.source_port.list()
  expect(
    ports.find((port) => port.name === "VDD")!.requires_voltage,
  ).toBeCloseTo(3.3)
  expect(ports.find((port) => port.name === "VDD")).toMatchObject({
    requires_power: true,
  })
  expect(ports.find((port) => port.name === "GND")).toMatchObject({
    requires_ground: true,
    requires_voltage: 0,
  })
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1200,
    height: 750,
    css: ".sch-text { white-space: pre; }",
  })
})
