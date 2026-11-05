import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import {
  CircuitJsonToKicadModConverter,
  CircuitJsonToKicadPcbConverter,
  CircuitJsonToKicadSchConverter,
} from "circuit-json-to-kicad"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("custom KiCad metadata survives rendering, validation, and all exports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        kicadFootprintMetadata={{
          footprintName: "MyPart",
          properties: {
            Value: { value: "MyPart" },
            Max_Current_A: { value: "6.4", hide: true },
          },
        }}
        kicadSymbolMetadata={{
          properties: {
            Value: { value: "MyPart" },
            Max_Current_A: { value: "6.4", effects: { hide: true } },
          },
        }}
        symbol={
          <symbol>
            <schematicrect width={1} height={1} />
            <port name="pin1" direction="left" schX={-0.5} />
          </symbol>
        }
        footprint={
          <footprint>
            <smtpad shape="rect" width={1} height={1} portHints={["pin1"]} />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = any_circuit_element
    .array()
    .parse(circuit.getCircuitJson())
  const pcbComponent = circuitJson.find(
    (element) => element.type === "pcb_component",
  )
  const schematicSymbol = circuitJson.find(
    (element) => element.type === "schematic_symbol",
  )
  expect(
    pcbComponent?.metadata?.kicad_footprint?.properties?.Max_Current_A,
  ).toEqual({ value: "6.4", hide: true })
  expect(
    schematicSymbol?.metadata?.kicad_symbol?.properties?.Max_Current_A,
  ).toEqual({ value: "6.4", effects: { hide: true } })
  for (const converter of [
    new CircuitJsonToKicadPcbConverter(circuitJson),
    new CircuitJsonToKicadSchConverter(circuitJson),
    new CircuitJsonToKicadModConverter(circuitJson),
  ]) {
    converter.runUntilFinished()
    expect(converter.getOutputString()).toContain(
      '(property "Max_Current_A" "6.4"',
    )
  }
})
