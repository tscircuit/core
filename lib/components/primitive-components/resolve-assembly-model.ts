import type { AssemblySubassemblyPropsInput } from "@tscircuit/props"
import { resolveAssemblyModelUrl } from "./resolve-assembly-model-url"

/** Resolve an authored assembly model without fetching or modifying its props. */
export const resolveAssemblyModel = (
  props: Pick<AssemblySubassemblyPropsInput, "model" | "modelUrl">,
) => {
  if (props.model !== undefined) {
    if (/^https?:\/\//i.test(props.model))
      return resolveAssemblyModelUrl(props.model)
    return {
      glbUrl: `https://modelcdn.tscircuit.com/jscad_models/${encodeURIComponent(props.model)}.glb`,
    }
  }
  if (props.modelUrl !== undefined)
    return resolveAssemblyModelUrl(props.modelUrl)
  return undefined
}
