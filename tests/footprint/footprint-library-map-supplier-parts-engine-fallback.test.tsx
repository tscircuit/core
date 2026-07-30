import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplier footprint falls back to the parts engine without a library resolver", async () => {
  const platformFetch = globalThis.fetch
  const { circuit } = getTestFixture({
    platform: {
      platformFetch,
      partsEngine: {
        findPart: async () => ({}),
        fetchPartCircuitJson: async ({
          supplierPartNumber,
          platformFetch: receivedPlatformFetch,
        }) => {
          expect(supplierPartNumber).toBe("123456")
          expect(receivedPlatformFetch).toBe(platformFetch)
          return external0402Footprint as AnyCircuitElement[]
        },
      },
    },
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        supplierPartNumbers={{ mouser: ["123456"] }}
        footprint="mouser:123456"
      />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.6}
        text="Supplier footprint loaded through parts engine"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.db.pcb_port.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
