import type { AssemblyScreen } from "./AssemblyScreen"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import {
  resolveAssemblyPlacement,
  updateAssemblyPcbPlacement,
} from "./resolve-assembly-placement"

const formatMillimetersForModelprinter = (millimeters: number): string =>
  Number(millimeters.toFixed(6)).toString()

const getDefaultFlexScreenModel = (component: AssemblyScreen): string => {
  const { width, height } = component._parsedProps
  if (width === undefined || height === undefined) {
    throw new Error(
      `assembly.screen "${component.name}" requires both width and height when cadModel is omitted`,
    )
  }
  return `flexscreen_w${formatMillimetersForModelprinter(width)}mm_h${formatMillimetersForModelprinter(height)}mm`
}

export const AssemblyScreen_doInitialCadModelRender = (
  component: AssemblyScreen,
): void => {
  if (
    !component.root ||
    component.root.pcbDisabled ||
    !component.pcb_component_id
  )
    return
  const placement = resolveAssemblyPlacement(component)
  updateAssemblyPcbPlacement(component, placement)
  component.cad_component_id = renderAssemblyCadModel(
    component,
    component._parsedProps.cadModel ?? getDefaultFlexScreenModel(component),
    placement,
  )
}
