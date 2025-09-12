import { NormalComponent } from "./NormalComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { isValidElement as isReactElement } from "react"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { isFootprintUrl } from "./utils/isFoorprintUrl"
import { parseLibraryFootprintRef } from "./utils/parseLibraryFootprintRef"
import type { CadModelProp } from "@tscircuit/props"
import { external_footprint_load_error } from "circuit-json"

interface FootprintLibraryResult {
  footprintCircuitJson: any[]
  cadModel?: CadModelProp
}

export function NormalComponent_doInitialPcbFootprintStringRender(
  component: NormalComponent<any, any>,
  queueAsyncEffect: (name: string, effect: () => Promise<void>) => void,
) {
  let { footprint } = component.props
  footprint ??= component._getImpliedFootprintString?.()

  if (!footprint) return

  const { pcbRotation, pinLabels, pcbPinLabels } = component.props

  if (typeof footprint === "string" && isFootprintUrl(footprint)) {
    if (component._hasStartedFootprintUrlLoad) return
    component._hasStartedFootprintUrlLoad = true
    const url = footprint
    queueAsyncEffect("load-footprint-url", async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Failed to fetch footprint: ${res.status}`)
        }
        const soup = await res.json()
        const fpComponents = createComponentsFromCircuitJson(
          {
            componentName: component.name,
            componentRotation: pcbRotation,
            footprint: url,
            pinLabels,
            pcbPinLabels,
          },
          soup as any,
        )
        component.addAll(fpComponents)
        component._markDirty("InitializePortsFromChildren")
      } catch (err) {
        const db = component.root?.db
        if (db && component.source_component_id && component.pcb_component_id) {
          const subcircuit = component.getSubcircuit()
          const errorMsg =
            `${component.getString()} failed to load external footprint "${url}": ` +
            (err instanceof Error ? err.message : String(err))
          const errorObj = external_footprint_load_error.parse({
            type: "external_footprint_load_error",
            message: errorMsg,
            pcb_component_id: component.pcb_component_id,
            source_component_id: component.source_component_id,
            subcircuit_id: subcircuit.subcircuit_id ?? undefined,
            pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
            footprinter_string: url,
          })
          db.external_footprint_load_error.insert(errorObj)
        }
        throw err
      }
    })
    return
  }

  // Handle library-style footprint strings via platform.footprintLibraryMap
  if (typeof footprint === "string") {
    const libRef = parseLibraryFootprintRef(footprint)
    if (!libRef) return

    if (component._hasStartedFootprintUrlLoad) return
    component._hasStartedFootprintUrlLoad = true

    const platform = component.root?.platform
    const libMap = platform?.footprintLibraryMap?.[libRef.footprintLib]

    // Find resolver: library can be a function or an object of resolvers
    let resolverFn:
      | ((path: string) => Promise<FootprintLibraryResult | any[]>)
      | undefined
    if (typeof libMap === "function") {
      resolverFn = libMap as (
        path: string,
      ) => Promise<FootprintLibraryResult | any[]>
    }

    if (!resolverFn) return

    queueAsyncEffect("load-lib-footprint", async () => {
      try {
        const result = await resolverFn!(libRef.footprintName)
        let circuitJson: any[] | null = null
        if (Array.isArray(result)) {
          circuitJson = result
        } else if (Array.isArray(result.footprintCircuitJson)) {
          circuitJson = result.footprintCircuitJson
        }
        if (!circuitJson) return
        const fpComponents = createComponentsFromCircuitJson(
          {
            componentName: component.name,
            componentRotation: pcbRotation,
            footprint,
            pinLabels,
            pcbPinLabels,
          },
          circuitJson,
        )
        component.addAll(fpComponents)
        if (!Array.isArray(result) && result.cadModel) {
          component._asyncFootprintCadModel = result.cadModel
        }
        // Ensure existing Ports re-run PcbPortRender now that pads exist
        for (const child of component.children) {
          if (child.componentName === "Port") {
            child._markDirty?.("PcbPortRender")
          }
        }
        component._markDirty("InitializePortsFromChildren")
      } catch (err) {
        const db = component.root?.db
        if (db && component.source_component_id && component.pcb_component_id) {
          const subcircuit = component.getSubcircuit()
          const errorMsg =
            `${component.getString()} failed to load external footprint "${footprint}": ` +
            (err instanceof Error ? err.message : String(err))
          const errorObj = external_footprint_load_error.parse({
            type: "external_footprint_load_error",
            message: errorMsg,
            pcb_component_id: component.pcb_component_id,
            source_component_id: component.source_component_id,
            subcircuit_id: subcircuit.subcircuit_id ?? undefined,
            pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
            footprinter_string: footprint,
          })
          db.external_footprint_load_error.insert(errorObj)
        }
        throw err
      }
    })
    return
  }

  if (
    !isReactElement(footprint) &&
    (footprint as Footprint).componentName === "Footprint"
  ) {
    component.add(footprint as Footprint)
  }
}
