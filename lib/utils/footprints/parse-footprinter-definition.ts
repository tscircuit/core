import { fp } from "@tscircuit/footprinter"
import { isFootprinterString } from "lib/components/base-components/NormalComponent/utils/isFootprinterString"

const footprinterFunctions = new Set(fp.getFootprintNames())

/** Parse known Footprinter definitions without rewriting invalid/imported input. */
export const parseFootprinterDefinition = (footprint: unknown) => {
  if (!isFootprinterString(footprint)) return null
  const definition = footprint.trim()
  const parameters = fp.string(definition).params()
  if (!footprinterFunctions.has(parameters.fn)) return null
  return { definition, parameters }
}
