import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { z } from "zod"

test("strict legacy parts engines preserve footprints when they reject the datasheet option", async () => {
  const legacyRequestSchema = z
    .object({
      supplierPartNumber: z.string().optional(),
      manufacturerPartNumber: z.string().optional(),
      platformFetch: z.function().optional(),
    })
    .strict()
  const requests: DatasheetPartCircuitJsonRequest[] = []
  const platformFetch: typeof fetch = Object.assign(
    () => {
      throw new Error("This fixture should not make network requests")
    },
    { preconnect: () => {} },
  )
  const { circuit } = getTestFixture({ platform: { platformFetch } })
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async (request) => {
      requests.push(request)
      legacyRequestSchema.parse(request)
      return external0402Footprint as AnyCircuitElement[]
    },
  }
  circuit.add(
    <board width="20mm" height="10mm" partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="EXAMPLE"
        supplierPartNumbers={{ jlcpcb: ["C_EXAMPLE"] }}
        footprint="jlcpcb:C_EXAMPLE"
        pinAttributes={{ pin1: { requiresVoltage: 2.8 } }}
      />
      <pcbnotetext
        pcbY={-3}
        text="Legacy parts engine: footprint preserved"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Other render phases independently check the supplier footprint.
  const importRequests = requests.filter(
    (request) => request.manufacturerPartNumber === "EXAMPLE",
  )
  expect(importRequests).toHaveLength(3)
  expect(
    importRequests.map((request) => request.includeDatasheetInformation),
  ).toEqual([true, false, undefined])
  expect(Object.hasOwn(importRequests[2], "includeDatasheetInformation")).toBe(
    false,
  )
  for (const request of importRequests) {
    expect(request.supplierPartNumber).toBe("C_EXAMPLE")
    expect(request.manufacturerPartNumber).toBe("EXAMPLE")
    expect(request.platformFetch).toBe(platformFetch)
  }
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(
    circuit.db.source_port.list().find((port) => port.pin_number === 1),
  ).toMatchObject({ requires_voltage: 2.8 })
  const warnings = circuit.db.source_property_ignored_warning
    .list()
    .filter((warning) => warning.property_name === "pinAttributes")
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toContain('chip "U1"')
  expect(warnings[0].message).not.toContain("#")
  expect(warnings[0].message).toContain(
    "only accepted a request without the datasheet option",
  )
  expect(warnings[0].message).toContain("Pin attributes may not be populated")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
