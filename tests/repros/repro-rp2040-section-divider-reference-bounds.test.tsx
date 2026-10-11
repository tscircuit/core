import { beforeAll, expect, test } from "bun:test"
import type { SchematicComponent, SchematicLine } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reported on imrishabh18/rp2040-motor-controller@1.0.42, motor_driver.
// This live circuit isolates the missing symbol {REF}/{VAL} bounds. The
// companion published-divider-overflow test preserves the entire real sheet.
let resistorSymbol: SchematicComponent
let divider: SchematicLine

beforeAll(async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board routingDisabled>
      <schematicsection name="driver" displayName="H-Bridge, Power & Control" />
      <schematicsection name="output" displayName="Stepper Motor Output" />
      <resistor
        name="R_DRV_ENABLE_PU"
        resistance="10k"
        schX={7.97}
        schY={-11.42}
        schOrientation="vertical"
        schSectionName="driver"
      />
      <chip
        name="J1"
        pinLabels={{}}
        schX={10.7}
        schY={-11.42}
        schWidth={1.2}
        schHeight={1}
        schSectionName="output"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const resistorSource = circuit.db.source_component
    .list()
    .find((component) => component.name === "R_DRV_ENABLE_PU")!
  resistorSymbol = circuit.db.schematic_component
    .list()
    .find(
      (component) =>
        component.source_component_id === resistorSource.source_component_id,
    )!
  divider = circuit.db.schematic_line
    .list()
    .find((line) => line.is_dashed && line.x1 === line.x2)!
  // Setup and the current visual snapshot must pass normally. Only the
  // desired clearance assertion below is marked as an expected failure.
  expect(divider).toBeDefined()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test.failing(
  "section divider must clear the complete resistor reference label",
  () => {
    // boxresistor_up uses a reference offset of +0.16. Core's text-bounds
    // helper conservatively reserves 0.12 units per character at font size 0.18.
    const referenceRight =
      resistorSymbol.center.x + 0.16 + "R_DRV_ENABLE_PU".length * 0.12
    expect(divider.x1).toBeGreaterThan(referenceRight)
  },
)
