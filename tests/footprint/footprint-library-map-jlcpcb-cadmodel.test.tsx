import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("jlcpcb footprint library map extracts cadModel from fetched circuit json", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({
          footprintCircuitJson: usbCC165948CircuitJson,
        }),
      },
    },
  })

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="jlcpcb:C165948" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const loadErrors = circuit.db.external_footprint_load_error.list()
  expect(loadErrors).toHaveLength(0)

  const circuitJson = circuit.getCircuitJson()
  const cadComponent = circuitJson.find(
    (el): el is CadComponent => el.type === "cad_component",
  )

  expect(cadComponent?.model_obj_url).toBeDefined()
  expect(cadComponent?.footprinter_string).toBeUndefined()
  expect(circuitJson.some((el) => el.type === "pcb_smtpad")).toBeTrue()
  expect(circuitJson.some((el) => el.type === "pcb_port")).toBeTrue()
})
