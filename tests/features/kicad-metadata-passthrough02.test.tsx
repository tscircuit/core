import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("kicad footprint metadata works on resistor, pushbutton, and jumper", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        kicadFootprintMetadata={{
          footprintName: "Resistor_SMD:R_0402_1005Metric",
          generator: "tscircuit",
          layer: "F.Cu",
          attributes: {
            smd: true,
          },
        }}
      />
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        kicadFootprintMetadata={{
          footprintName: "Button_Switch_THT:SW_PUSH_6mm",
          generator: "tscircuit",
          layer: "F.Cu",
          attributes: {
            through_hole: true,
          },
        }}
      />
      <jumper
        name="J1"
        footprint="pinrow2"
        kicadFootprintMetadata={{
          footprintName:
            "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical",
          generator: "tscircuit",
          layer: "F.Cu",
          attributes: {
            through_hole: true,
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Helper to find the pcb_component for a given source component name
  const sourceComponents = circuitJson.filter(
    (el: any) => el.type === "source_component",
  ) as any[]
  const pcbComponents = circuitJson.filter(
    (el: any) => el.type === "pcb_component",
  ) as any[]
  const getPcbMetadata = (name: string) => {
    const sc = sourceComponents.find((s: any) => s.name === name)
    const pcb = pcbComponents.find(
      (p: any) => p.source_component_id === sc.source_component_id,
    )
    return pcb?.metadata
  }

  // Verify resistor (uses base NormalComponent.doInitialPcbComponentRender)
  expect(getPcbMetadata("R1")?.kicad_footprint).toEqual({
    footprintName: "Resistor_SMD:R_0402_1005Metric",
    generator: "tscircuit",
    layer: "F.Cu",
    attributes: {
      smd: true,
    },
  })

  // Verify pushbutton (uses base NormalComponent.doInitialPcbComponentRender)
  expect(getPcbMetadata("SW1")?.kicad_footprint).toEqual({
    footprintName: "Button_Switch_THT:SW_PUSH_6mm",
    generator: "tscircuit",
    layer: "F.Cu",
    attributes: {
      through_hole: true,
    },
  })

  // Verify jumper (has its own doInitialPcbComponentRender override)
  expect(getPcbMetadata("J1")?.kicad_footprint).toEqual({
    footprintName: "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical",
    generator: "tscircuit",
    layer: "F.Cu",
    attributes: {
      through_hole: true,
    },
  })
})
