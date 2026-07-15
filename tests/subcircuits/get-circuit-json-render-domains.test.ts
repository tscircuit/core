import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getCircuitJsonRenderDomains } from "lib/components/primitive-components/Group/Subcircuit/get-circuit-json-render-domains"

const circuitElement = (
  type: AnyCircuitElement["type"],
  diagnosticType?: "error_type" | "warning_type",
) =>
  ({
    type,
    ...(diagnosticType ? { [diagnosticType]: type } : {}),
  }) as AnyCircuitElement

test("diagnostics do not define Circuit JSON render domains", () => {
  expect(
    getCircuitJsonRenderDomains([
      circuitElement("source_component"),
      circuitElement("pcb_missing_footprint_error", "error_type"),
    ]),
  ).toEqual({ pcb: false, schematic: false })

  expect(
    getCircuitJsonRenderDomains([
      circuitElement("source_component"),
      circuitElement("pcb_component"),
      circuitElement("schematic_error", "error_type"),
      circuitElement("schematic_manual_edit_conflict_warning", "warning_type"),
    ]),
  ).toEqual({ pcb: true, schematic: false })

  expect(
    getCircuitJsonRenderDomains([
      circuitElement("source_component"),
      circuitElement("schematic_component"),
    ]),
  ).toEqual({ pcb: false, schematic: true })
})
