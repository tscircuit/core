import type { FootprintLibraryResult } from "@tscircuit/props"
import {
  circuit_json_footprint_load_error,
  external_footprint_load_error,
} from "circuit-json"
import type { AnyCircuitElement } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { extractCadModelFromCircuitJson } from "lib/utils/connectors/extractCadModelFromCircuitJson"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { resolveStaticFileImport } from "lib/utils/resolveStaticFileImport"
import { isValidElement as isReactElement } from "react"
import { NormalComponent } from "./NormalComponent"
import { getFileExtension } from "./utils/getFileExtension"
import { isHttpUrl } from "./utils/isHttpUrl"
import { isStaticAssetPath } from "./utils/isStaticAssetPath"
import { parseLibraryFootprintRef } from "./utils/parseLibraryFootprintRef"

type FootprintLibraryResolver = (
  path: string,
) => Promise<FootprintLibraryResult | AnyCircuitElement[]>

const normalizeJlcpcbSupplierPartNumber = (partNumber: string) => {
  const trimmedPartNumber = partNumber.trim()
  if (/^\d+$/.test(trimmedPartNumber)) return `C${trimmedPartNumber}`
  if (/^c\d+$/i.test(trimmedPartNumber)) {
    return `C${trimmedPartNumber.slice(1)}`
  }
  return trimmedPartNumber
}

const shouldAddOutsideFootprintWrapper = (component: PrimitiveComponent) =>
  component.componentName === "Symbol" || component.isSchematicPrimitive

export function NormalComponent_doInitialPcbFootprintStringRender(
  component: NormalComponent<any, any>,
  queueAsyncEffect: (name: string, effect: () => Promise<void>) => void,
) {
  const footprint = component.resolveFootprint()

  if (!footprint) return

  const { pcbRotation, pcbPinLabels } = component.props
  const pinLabels = component._resolvePinLabels()
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
        component._markDirty("ResolveFootprintPinLabels")
        component._markDirty("InitializePortsFromChildren")
      } catch (err) {
        const db = component.root?.db
        if (db && component.source_component_id && component.pcb_component_id) {
          const subcircuit = component.getSubcircuit()
          const errorMsg = `${component.getString()} failed to load footprint "${footprintUrl}": ${err instanceof Error ? err.message : String(err)}`
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
        component._markDirty("ResolveFootprintPinLabels")
        component._markDirty("InitializePortsFromChildren")
      } catch (err) {
        const db = component.root?.db
        if (db && component.source_component_id && component.pcb_component_id) {
          const subcircuit = component.getSubcircuit()
          const errorMsg = `${component.getString()} failed to load external footprint "${url}": ${err instanceof Error ? err.message : String(err)}`
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

    let resolverFn: FootprintLibraryResolver | undefined
    if (typeof libMap === "function") {
      resolverFn = libMap as FootprintLibraryResolver
    }

    // A platform may provide a parts engine without carrying over its built-in
    // footprint library map (for example when platform overrides are merged).
    // Explicit jlcpcb: references can still be resolved through that engine.
    if (
      !resolverFn &&
      libRef.footprintLib.toLowerCase() === "jlcpcb" &&
      platform?.partsEngine?.fetchPartCircuitJson
    ) {
      const fetchPartCircuitJson = platform.partsEngine.fetchPartCircuitJson
      resolverFn = async (partNumber) => {
        const supplierPartNumber = normalizeJlcpcbSupplierPartNumber(partNumber)
        const footprintCircuitJson = await fetchPartCircuitJson({
          supplierPartNumber,
          platformFetch: platform.platformFetch,
        })
        if (!Array.isArray(footprintCircuitJson)) {
          throw new Error(
            `Parts engine returned no circuit JSON for JLCPCB footprint "${supplierPartNumber}".`,
          )
        }
        return { footprintCircuitJson }
      }
    }

    if (!resolverFn) {
      resolverFn = async () => {
        throw new Error(
          `No footprint resolver is configured for library "${libRef.footprintLib}".`,
        )
      }
    }

    queueAsyncEffect("load-lib-footprint", async () => {
      try {
        const result = await resolverFn!(libRef.footprintName)
        let circuitJson: any[] | null = null
        if (Array.isArray(result)) {
          circuitJson = result
        } else if (Array.isArray(result.footprintCircuitJson)) {
          circuitJson = result.footprintCircuitJson
        }
        if (!circuitJson || circuitJson.length === 0) {
          throw new Error(
            `Footprint resolver returned no circuit elements for "${footprint}".`,
          )
        }
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
        // Wrap in a Footprint with src so pcbSx selectors like
        // "& footprint[src^='kicad:'] silkscreentext" can match
        const fpWrapper = new Footprint({ src: footprint })
        const componentsOutsideFootprint: typeof fpComponents = []
        for (const c of fpComponents) {
          // TODO: Remove this when we have a schematic symbol render and don't need to add in here
          if (shouldAddOutsideFootprintWrapper(c)) {
            componentsOutsideFootprint.push(c)
          } else {
            fpWrapper.add(c)
          }
        }
        component.add(fpWrapper)
        component.addAll(componentsOutsideFootprint)
        component._asyncFootprintCadModel =
          (!Array.isArray(result) && result.cadModel) ||
          extractCadModelFromCircuitJson(circuitJson)
        // Ensure existing Ports re-run PcbPortRender now that pads exist
        for (const child of component.children) {
          if (child.componentName === "Port") {
            child._markDirty?.("PcbPortRender")
          }
        }
        component._markDirty("ResolveFootprintPinLabels")
        component._markDirty("InitializePortsFromChildren")
      } catch (err) {
        const db = component.root?.db
        if (db && component.source_component_id && component.pcb_component_id) {
          const subcircuit = component.getSubcircuit()
          const errorMsg = `${component.getString()} failed to load external footprint "${footprint}": ${err instanceof Error ? err.message : String(err)}`
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
        const errorMsg = `${component.getString()} failed to load json footprint: ${err instanceof Error ? err.message : String(err)}`
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
