import { fp } from "@tscircuit/footprinter"
import type { FootprintProp } from "@tscircuit/props"
import { isFootprinterString } from "lib/components/base-components/NormalComponent/utils/isFootprinterString"
import { z } from "zod"

const footprinterFunctions = new Set(fp.getFootprintNames())
const pinOption = z
  .union([z.number(), z.string(), z.boolean()])
  .transform(Number)
const polarityOption = z.union([z.boolean(), z.string()]).optional()

// Footprinter's params() is untyped. Validate the fields core consumes once here;
// the complete authored definition retains every other package option unchanged.
const definitionParameters = z.object({
  fn: z.string(),
  num_pins: z.number().optional(),
  polarized: polarityOption,
  nonpolarized: polarityOption,
  anodepin: pinOption.optional(),
  cathodepin: pinOption.optional(),
  positivepin: pinOption.optional(),
  negativepin: pinOption.optional(),
})

/** Parse known Footprinter definitions without rewriting invalid/imported input. */
export const parseFootprinterDefinition = (
  footprint: FootprintProp | null | undefined,
) => {
  if (!isFootprinterString(footprint)) return null
  const definition = footprint.trim()
  const parsed = definitionParameters.safeParse(fp.string(definition).params())
  if (!parsed.success || !footprinterFunctions.has(parsed.data.fn)) return null
  return { definition, parameters: parsed.data }
}
