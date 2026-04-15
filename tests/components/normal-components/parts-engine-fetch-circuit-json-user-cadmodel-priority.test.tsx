import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("connector usb_c prefers user cadModel over fetched part cad_component", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async ({ sourceComponent }: any) => {
      if (
        sourceComponent.ftype === "simple_connector" &&
        sourceComponent.standard === "usb_c"
      ) {
        return { jlcpcb: ["C165948"] }
      }
      return {}
    },
    fetchPartCircuitJson: async ({
      supplierPartNumber,
    }: {
      supplierPartNumber?: string
      manufacturerPartNumber?: string
    }) => {
      if (supplierPartNumber === "C165948") {
        return usbCC165948CircuitJson as AnyCircuitElement[]
      }
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector
        name="USB1"
        standard="usb_c"
        cadModel={{ glbUrl: "https://example.com/user-model.glb" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()

  const cadComponents = circuit.db.cad_component
    .list()
    .filter(
      (cad: any) =>
        cad.source_component_id === sourceComponent!.source_component_id,
    )

  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0].model_glb_url).toBe(
    "https://example.com/user-model.glb",
  )
  expect(cadComponents[0].model_obj_url).toBeUndefined()
})
