import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

type SourceComponentElement = Extract<
  AnyCircuitElement,
  { type: "source_component" }
>
type SchematicComponentElement = Extract<
  AnyCircuitElement,
  { type: "schematic_component" }
>

test("inflated schematic proxies attach to their physical source component", async () => {
  const renderedCircuitJson = await renderToCircuitJson(
    <board width="18mm" height="12mm">
      <chip
        name="U1"
        pinLabels={{ pin1: "IN", pin2: "OUT" }}
        symbolName="opamp_with_power_right"
        footprint="soic8"
        schX={4}
        schY={-2}
      />
    </board>,
  )
  const sourceChip = renderedCircuitJson.find(
    (element): element is SourceComponentElement =>
      element.type === "source_component" && element.name === "U1",
  )
  const schematicComponent = renderedCircuitJson.find(
    (element): element is SchematicComponentElement =>
      element.type === "schematic_component" &&
      element.source_component_id === sourceChip?.source_component_id,
  )
  if (!schematicComponent) throw new Error("Expected U1 schematic component")
  const proxySourceComponentId = "source_component_schematic_proxy"
  const importedCircuitJson: AnyCircuitElement[] = renderedCircuitJson.map(
    (element) =>
      element === schematicComponent
        ? { ...element, source_component_id: proxySourceComponentId }
        : element,
  )
  importedCircuitJson.push({
    type: "source_component",
    source_component_id: proxySourceComponentId,
    ftype: "simple_chip",
    name: "U1_PROXY",
    display_name: "U1",
  })
  const { circuit } = getTestFixture()
  circuit.add(<board circuitJson={importedCircuitJson} />)

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.getWhere({ name: "U1_PROXY" })).toBeNull()
  expect(circuit.db.schematic_component.list()).toHaveLength(1)
  expect(circuit.db.schematic_component.list()[0]?.center).toEqual(
    schematicComponent.center,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
