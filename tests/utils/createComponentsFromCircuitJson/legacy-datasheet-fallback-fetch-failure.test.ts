import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { Chip } from "lib/components/normal-components/Chip"
import { fetchPartCircuitJsonWithDatasheet } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { z } from "zod"

test("a legacy request retry still propagates a genuine supplier fetch failure", async () => {
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
    throw new Error("Supplier service unavailable")
  }
  await expect(
    fetchPartCircuitJsonWithDatasheet(
      { fetchPartCircuitJson, supplierPartNumber: "C_EXAMPLE" },
      new Chip({ name: "U1" }),
    ),
  ).rejects.toThrow("Supplier service unavailable")
  expect(legacyRequestAccepted).toBe(true)
})
