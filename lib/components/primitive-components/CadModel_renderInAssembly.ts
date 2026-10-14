import {
  type CadModelProp,
  type CadModelProps,
  cadModelBase,
  point3,
} from "@tscircuit/props"
import type { ReactElement } from "react"
import { resolveAssemblyModelUrl } from "./resolve-assembly-model-url"
import type { CadModel } from "./CadModel"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import {
  findParentAssembly,
  resolveAssemblyPlacement,
} from "./resolve-assembly-placement"

/** CAD children use assembly-local offsets (mm, right-handed +Z outward).
 * Resolve the owner first because render phases visit children before parents.
 */
export const CadModel_renderInAssembly = (component: CadModel): boolean => {
  const owner = findParentAssembly(component)
  if (!owner) return false
  if (component.root?.pcbDisabled || !owner.source_component_id) return true
  const placement = resolveAssemblyPlacement(owner)
  const props: CadModelProps | null =
    typeof component._parsedProps === "string"
      ? { modelUrl: component._parsedProps }
      : component._parsedProps
  if (!props) return true
  const { pcbX, pcbY } = component.getResolvedPcbPositionProp()
  const base = cadModelBase.parse({
    ...props,
    positionOffset:
      props.positionOffset ??
      point3.parse({
        x: pcbX,
        y: pcbY,
        z: props.pcbZ ?? 0,
      }),
  })
  let model: Exclude<CadModelProp, ReactElement | null> | undefined
  if (props.jscad !== undefined) {
    model = { ...base, jscad: props.jscad }
  } else if (props.modelUrl !== undefined) {
    model = { ...base, ...resolveAssemblyModelUrl(props.modelUrl) }
  } else {
    return true
  }
  component.cad_component_id = renderAssemblyCadModel(owner, model, placement)
  return true
}
