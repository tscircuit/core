import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { Chip } from "lib/components/normal-components/Chip"
import { fetchPartCircuitJsonWithDatasheet } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { z } from "zod"

test("a legacy request retry cannot substitute a different regulator voltage variant", async () => {
  const legacyRequestSchema = z
    .object({
      supplierPartNumber: z.string().optional(),
      manufacturerPartNumber: z.string().optional(),
      platformFetch: z.function().optional(),
    })
    .strict()
  let legacyRequestAccepted = false
  const fetchPartCircuitJson: NonNullable<
    PartsEngine["fetchPartCircuitJson"]
  > = async (request) => {
    legacyRequestSchema.parse(request)
    legacyRequestAccepted = true
    return [
      {
        type: "source_component",
        ftype: "simple_chip",
        source_component_id: "imported_regulator",
        name: "U1",
        manufacturer_part_number: "AP2112K-1.8TRG1",
      },
    ]
  }
  await expect(
    fetchPartCircuitJsonWithDatasheet(
      {
        fetchPartCircuitJson,
        supplierPartNumber: "C_WRONG",
        manufacturerPartNumber: "AP2112K-2.8TRG1",
      },
      new Chip({ name: "U1" }),
    ),
  ).rejects.toThrow()
  expect(legacyRequestAccepted).toBe(true)
})
