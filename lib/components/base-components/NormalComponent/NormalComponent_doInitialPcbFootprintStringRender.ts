import { NormalComponent } from "./NormalComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { isValidElement as isReactElement } from "react"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { isHttpUrl } from "./utils/isHttpUrl"
import { parseLibraryFootprintRef } from "./utils/parseLibraryFootprintRef"
import type { CadModelProp } from "@tscircuit/props"
import type { PcbStyle } from "@tscircuit/props/lib/common/pcbStyle"
import {
  circuit_json_footprint_load_error,
  external_footprint_load_error,
} from "circuit-json"
import { getFileExtension } from "./utils/getFileExtension"
import { isStaticAssetPath } from "./utils/isStaticAssetPath"
import { resolveStaticFileImport } from "lib/utils/resolveStaticFileImport"

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
  const fileExtension = getFileExtension(String(footprint))
  const footprintParser = fileExtension
    ? component.root?.platform?.footprintFileParserMap?.[fileExtension]
    : null
  if (
    typeof footprint === "string" &&
    (isHttpUrl(footprint) || isStaticAssetPath(footprint)) &&
    footprintParser
  ) {
    if (component._hasStartedFootprintUrlLoad) return
    component._hasStartedFootprintUrlLoad = true
    queueAsyncEffect("load-footprint-from-platform-file-parser", async () => {
      const footprintUrl = isHttpUrl(footprint)
        ? footprint
        : await resolveStaticFileImport(footprint, component.root?.platform)
      try {
        const result = await footprintParser.loadFromUrl(footprintUrl)
        const fpComponents = createComponentsFromCircuitJson(
          {
            componentName: component.name,
            componentRotation: pcbRotation,
            footprinterString: footprintUrl,
            pinLabels,
            pcbPinLabels,
          },
          result.footprintCircuitJson,
        )
        component.addAll(fpComponents)
        component._markDirty("InitializePortsFromChildren")
      } catch (err) {
        const db = component.root?.db
        if (db && component.source_component_id && component.pcb_component_id) {
          const subcircuit = component.getSubcircuit()
          const errorMsg =
            `${component.getString()} failed to load footprint "${footprintUrl}": ` +
            (err instanceof Error ? err.message : String(err))
          const errorObj = external_footprint_load_error.parse({
            type: "external_footprint_load_error",
            message: errorMsg,
            pcb_component_id: component.pcb_component_id,
            source_component_id: component.source_component_id,
            subcircuit_id: subcircuit.subcircuit_id ?? undefined,
            pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
            footprinter_string: footprintUrl,
          })
          db.external_footprint_load_error.insert(errorObj)
        }
        throw err
      }
    })
    return
  }
  if (typeof footprint === "string" && isHttpUrl(footprint)) {
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
            footprinterString: url,
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
      | ((
          path: string,
          options?: { resolvedPcbStyle?: PcbStyle },
        ) => Promise<FootprintLibraryResult | any[]>)
      | undefined
    if (typeof libMap === "function") {
      resolverFn = libMap as (
        path: string,
        options?: { resolvedPcbStyle?: PcbStyle },
      ) => Promise<FootprintLibraryResult | any[]>
    }

    if (!resolverFn) return

    // Get the resolved pcbStyle from the component
    const resolvedPcbStyle = component.getInheritedProperty("pcbStyle")

    queueAsyncEffect("load-lib-footprint", async () => {
      try {
        const result = await resolverFn!(libRef.footprintName, {
          resolvedPcbStyle,
        })
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
            footprinterString: footprint,
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

  if (
    Array.isArray(footprint) &&
    !isReactElement(footprint) &&
    footprint.length > 0
  ) {
    try {
      const fpComponents = createComponentsFromCircuitJson(
        {
          componentName: component.name,
          componentRotation: pcbRotation,
          footprinterString: "",
          pinLabels,
          pcbPinLabels,
        },
        footprint,
      )
      component.addAll(fpComponents)
    } catch (err) {
      const db = component.root?.db
      if (db && component.source_component_id && component.pcb_component_id) {
        const subcircuit = component.getSubcircuit()
        const errorMsg =
          `${component.getString()} failed to load json footprint: ` +
          (err instanceof Error ? err.message : String(err))
        const errorObj = circuit_json_footprint_load_error.parse({
          type: "circuit_json_footprint_load_error",
          message: errorMsg,
          pcb_component_id: component.pcb_component_id,
          source_component_id: component.source_component_id,
          subcircuit_id: subcircuit.subcircuit_id ?? undefined,
          pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
        })
        db.circuit_json_footprint_load_error.insert(errorObj)
      }
      throw err
    }
    return
  }
}
