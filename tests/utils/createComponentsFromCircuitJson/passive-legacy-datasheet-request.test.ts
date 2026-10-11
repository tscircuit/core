import { expect, spyOn, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Resistor } from "lib/components/normal-components/Resistor"
import {
  type DatasheetPartCircuitJsonRequest,
  fetchPartCircuitJsonWithDatasheet,
} from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { z } from "zod"

test("passives preserve strict legacy imports without datasheet warnings", async () => {
  const requests: DatasheetPartCircuitJsonRequest[] = []
  const legacySchema = z
    .object({
      supplierPartNumber: z.string().optional(),
      manufacturerPartNumber: z.string().optional(),
      platformFetch: z.function().optional(),
    })
    .strict()
  const resistor = new Resistor({ name: "R1", resistance: "10k" })
  const importedFootprint: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "supplier_part",
      name: "R1",
      ftype: "simple_resistor",
      resistance: 10000,
    },
  ]
  const warn = spyOn(console, "warn").mockImplementation(() => {})
  try {
    const result = await fetchPartCircuitJsonWithDatasheet(
      {
        supplierPartNumber: "C_R",
        fetchPartCircuitJson: async (request) => {
          requests.push(request)
          legacySchema.parse(request)
          return importedFootprint
        },
      },
      resistor,
    )
    expect(result).toEqual(importedFootprint)
    expect(
      requests.map((request) => request.includeDatasheetInformation),
    ).toEqual([false, undefined])
    expect(warn).not.toHaveBeenCalled()
  } finally {
    warn.mockRestore()
  }
})
