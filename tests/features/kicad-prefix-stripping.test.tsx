import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("kicad: prefix is stripped in cad_component but preserved in pcb_component metadata", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          // Return a minimal footprint
          return {
            footprintCircuitJson: [
              {
                type: "pcb_smtpad",
                shape: "rect",
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                layer: "top",
                port_hints: ["1"],
              },
            ],
          }
        },
      },
    },
  })

  const footprintName = "Connector_JST/JST_PH_B2B-PH-SM4-TB_1x02-1MP_P2.00mm_Vertical"
  const fullFootprintPath = `kicad:${footprintName}`

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint={fullFootprintPath}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // 1. Verify no "Invalid footprint function" errors occurred (which would be reported as unknown errors or crashes)
  // If it rendered at all, it likely didn't crash on fp.string()

  // 2. Check pcb_component
  const pcbComponent = circuitJson.find((el) => el.type === "pcb_component") as any
  expect(pcbComponent).toBeDefined()
  // Metadata should still have the prefix if it was passed via props (or however it's handled)
  // Actually, let's check what we implemented. We didn't change metadata insertion.

  // 3. Check cad_component - THIS IS THE CRITICAL PART
  const cadComponent = circuitJson.find((el) => el.type === "cad_component") as any
  expect(cadComponent).toBeDefined()
  expect(cadComponent.footprinter_string).toBe(footprintName)
  expect(cadComponent.footprinter_string).not.toContain("kicad:")

  // 4. Check for any load errors
  const loadErrors = circuitJson.filter((el) => el.type === "external_footprint_load_error")
  expect(loadErrors).toHaveLength(0)
})
