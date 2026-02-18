import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("kicad metadata props are passed through to circuit-json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        kicadFootprintMetadata={{
          footprintName: "SOIC-8_3.9x4.9mm_P1.27mm",
          generator: "tscircuit",
          layer: "F.Cu",
          properties: {
            Reference: { value: "U", hide: false },
            Value: { value: "SOIC-8", hide: false },
          },
          attributes: {
            smd: true,
            exclude_from_bom: false,
          },
        }}
        kicadSymbolMetadata={{
          symbolName: "LM358",
          inBom: true,
          onBoard: true,
          pinNames: {
            offset: 1.016,
            hide: false,
          },
          properties: {
            Reference: { value: "U" },
            Value: { value: "LM358" },
            Footprint: {
              value: "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
            },
          },
        }}
        symbol={
          <symbol>
            <schematicline
              x1={-0.5}
              y1={-0.6}
              x2={-0.5}
              y2={0.6}
              strokeWidth={0.05}
            />
            <schematicline
              x1={-0.5}
              y1={0.6}
              x2={0.5}
              y2={0}
              strokeWidth={0.05}
            />
            <schematicline
              x1={0.5}
              y1={0}
              x2={-0.5}
              y2={-0.6}
              strokeWidth={0.05}
            />
            <schematicline x1={-1} y1={0} x2={-0.5} y2={0} strokeWidth={0.05} />
            <schematicline x1={0.5} y1={0} x2={1} y2={0} strokeWidth={0.05} />
            <port name="pin1" direction="right" schX={1} schY={0} />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Verify pcb_component has kicad_footprint metadata
  const pcbComponent = circuitJson.find(
    (el: any) => el.type === "pcb_component",
  ) as any
  expect(pcbComponent).toBeDefined()
  expect(pcbComponent.metadata?.kicad_footprint).toEqual({
    footprintName: "SOIC-8_3.9x4.9mm_P1.27mm",
    generator: "tscircuit",
    layer: "F.Cu",
    properties: {
      Reference: { value: "U", hide: false },
      Value: { value: "SOIC-8", hide: false },
    },
    attributes: {
      smd: true,
      exclude_from_bom: false,
    },
  })

  // Verify schematic_symbol has kicad_symbol metadata
  const schematicSymbol = circuitJson.find(
    (el: any) => el.type === "schematic_symbol",
  ) as any
  expect(schematicSymbol).toBeDefined()
  expect(schematicSymbol.metadata?.kicad_symbol).toEqual({
    symbolName: "LM358",
    inBom: true,
    onBoard: true,
    pinNames: {
      offset: 1.016,
      hide: false,
    },
    properties: {
      Reference: { value: "U" },
      Value: { value: "LM358" },
      Footprint: {
        value: "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
      },
    },
  })
})
