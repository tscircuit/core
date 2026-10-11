import { beforeAll, expect, test } from "bun:test"
import type { SchematicComponent, SchematicLine } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Rp2040SectionDividerReferenceFixture } from "./fixtures/rp2040-section-divider-reference.fixture"

// Affected board: https://tscircuit.com/imrishabh18/rp2040-motor-controller#schematic
// Version 1.0.42, motor_driver sheet, R_DRV_ENABLE_PU.
const regressionTest = process.env.TSCIRCUIT_ENABLE_RP2040_DIVIDER_REPRO
  ? test
  : test.failing
let resistorSymbol: SchematicComponent
let divider: SchematicLine

beforeAll(async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(<Rp2040SectionDividerReferenceFixture />)
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

regressionTest(
  "section divider must clear the complete resistor reference label",
  () => {
    // boxresistor_up uses a reference offset of +0.16. Core's text-bounds
    // helper conservatively reserves 0.12 units per character at font size 0.18.
    const referenceRight =
      resistorSymbol.center.x + 0.16 + "R_DRV_ENABLE_PU".length * 0.12
    expect(divider.x1).toBeGreaterThan(referenceRight)
  },
)
