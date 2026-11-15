import { fp } from "@tscircuit/footprinter"
import {
  type FootprintLibraryResult,
  type PartsEngine,
  type SupplierName,
  type SupplierPartNumbers,
  resolveManufacturerPartNumber,
  supplierProps,
} from "@tscircuit/props"
import {
  type AnyCircuitElement,
  circuit_json_footprint_load_error,
  external_footprint_load_error,
} from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Footprint } from "lib/components/primitive-components/Footprint"
import { Port } from "lib/components/primitive-components/Port"
import { extractCadModelFromCircuitJson } from "lib/utils/connectors/extractCadModelFromCircuitJson"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { fetchPartCircuitJsonWithDatasheet } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { resolveStaticFileImport } from "lib/utils/resolveStaticFileImport"
import { isValidElement as isReactElement } from "react"
import type { NormalComponent } from "./NormalComponent"
import { getFileExtension } from "./utils/getFileExtension"
import { isBlobUrl } from "./utils/isBlobUrl"
import { isHttpUrl } from "./utils/isHttpUrl"
import { isStaticAssetPath } from "./utils/isStaticAssetPath"
import { parseLibraryFootprintRef } from "./utils/parseLibraryFootprintRef"

type FootprintLibraryResolver = (
  footprintName: string,
) => Promise<FootprintLibraryResult | AnyCircuitElement[]>

const supplierNames = supplierProps.shape.supplierPartNumbers.unwrap().keySchema
  .options satisfies SupplierName[]

const inflatedFootprintInstances = new WeakSet<Footprint>()

const shouldAddOutsideFootprintWrapper = (component: PrimitiveComponent) =>
  component.componentName === "Symbol" || component.isSchematicPrimitive

const addInflatedComponentsToFootprint = (
  component: NormalComponent<any, any>,
  footprintChild: Footprint,
  fpComponents: PrimitiveComponent[],
) => {
  const componentsOutsideFootprint: PrimitiveComponent[] = []
  for (const child of fpComponents) {
    if (shouldAddOutsideFootprintWrapper(child)) {
      componentsOutsideFootprint.push(child)
    } else {
      footprintChild.add(child)
    }
  }
  if (componentsOutsideFootprint.length > 0) {
    component.addAll(componentsOutsideFootprint)
  }
}

const markComponentPortsDirtyAfterFootprintInflation = (
  component: NormalComponent<any, any>,
  isAsyncInflation: boolean,
) => {
  for (const child of component.children) {
    if (child.componentName === "Port") {
      child._markDirty("PcbPortRender")
    }
  }
  if (isAsyncInflation) {
    component._markDirty("ResolveFootprintPinLabels")
    component._markDirty("PcbComponentSizeCalculation")
    component.getSubcircuit()?._markDirty("PcbTraceRender")
  }
  component._markDirty("InitializePortsFromChildren")
}

const getSupplierPartCircuitJsonResolver = (
  component: NormalComponent<any, any>,
  footprintLibrary: string,
  footprintName: string,
): FootprintLibraryResolver | undefined => {
  if (component.getInheritedProperty("partsEngineDisabled")) return

  const supplierPartNumbers = component.props.supplierPartNumbers as
    | SupplierPartNumbers
    | undefined
  const supplierName = supplierNames.find(
    (candidateSupplierName) => candidateSupplierName === footprintLibrary,
  )
  if (!supplierName) return

  const matchingSupplierPartNumbers = supplierPartNumbers?.[supplierName]
  if (!matchingSupplierPartNumbers?.includes(footprintName)) return

  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  const fetchPartCircuitJson = partsEngine?.fetchPartCircuitJson
  if (!fetchPartCircuitJson) return

  return async (supplierPartNumber) => {
    const footprintCircuitJson = await fetchPartCircuitJsonWithDatasheet(
      {
        fetchPartCircuitJson,
        supplierPartNumber,
        manufacturerPartNumber: resolveManufacturerPartNumber(component.props),
      },
      component,
    )
    return { footprintCircuitJson: footprintCircuitJson ?? [] }
  }
}

const recordExternalFootprintLoadError = (
  component: NormalComponent<any, any>,
  footprintRef: string,
  err: unknown,
  label: string,
) => {
  const db = component.root?.db
  if (db && component.source_component_id && component.pcb_component_id) {
    const subcircuit = component.getSubcircuit()
    const errorMsg = `${component.getString()} failed to load ${label} "${footprintRef}": ${err instanceof Error ? err.message : String(err)}`
    const errorObj = external_footprint_load_error.parse({
      type: "external_footprint_load_error",
      message: errorMsg,
      pcb_component_id: component.pcb_component_id,
      source_component_id: component.source_component_id,
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
      footprinter_string: footprintRef,
    })
    db.external_footprint_load_error.insert(errorObj)
  }
}

const reportInvalidFootprintSrcError = (
  component: NormalComponent<any, any>,
  footprint: string,
  error: unknown,
) => {
  const rawErrorMessage = error instanceof Error ? error.message : String(error)
  const isLikelyMissingLibraryPrefix =
    footprint.includes("/") && !footprint.includes(":")
  const isLikelyJlcpcbPartNumber = /^c\d+$/i.test(footprint)
  const resolvedJlcpcbPartNumber = isLikelyJlcpcbPartNumber
    ? `C${footprint.replace(/^c/i, "")}`
    : null
  const helpfulHint = isLikelyMissingLibraryPrefix
    ? ` If this is a KiCad footprint, use "kicad:${footprint}".`
    : resolvedJlcpcbPartNumber
      ? ` If this is a JLCPCB part number, use "jlcpcb:${resolvedJlcpcbPartNumber}".`
      : ""
  const message = `Invalid footprint prop on ${component.getDisplayName()}: "${footprint}".${helpfulHint} Parser details: ${rawErrorMessage}`

  const insertError = () => {
    const db = component.root?.db
    if (!db) return
    const alreadyExists = db.source_invalid_component_property_error
      .list()
      .some(
        (existing) =>
          existing.source_component_id ===
            (component.source_component_id || "") &&
          existing.message === message,
      )
    if (alreadyExists) return
    db.source_invalid_component_property_error.insert({
      source_component_id: component.source_component_id || "",
      property_name: "footprint",
      message,
      error_type: "source_invalid_component_property_error",
    })
  }

  if (component.source_component_id) {
    insertError()
  } else {
    component._queueAsyncEffect("report-invalid-footprint-src", async () => {
      insertError()
    })
  }
}

const inflateCircuitJsonIntoFootprint = (
  component: NormalComponent<any, any>,
  footprintChild: Footprint,
  circuitJson: AnyCircuitElement[],
  footprinterString: string,
) => {
  const { pcbRotation, pcbPinLabels } = component.props
  const pinLabels = component._resolvePinLabels()
  try {
    const fpComponents = createComponentsFromCircuitJson(
      {
        sourcePortOwner: component,
        componentName: component.name ?? component.componentName,
        componentRotation: pcbRotation,
        footprinterString,
        pinLabels,
        pcbPinLabels,
      },
      circuitJson,
    )
    addInflatedComponentsToFootprint(component, footprintChild, fpComponents)
    if (component._asyncFootprintCadModel === undefined) {
      component._asyncFootprintCadModel =
        extractCadModelFromCircuitJson(circuitJson)
    }
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
}

const inflateFootprintChildrenIfNeeded = (
  component: NormalComponent<any, any>,
) => {
  const resolvedFootprint = component.resolveFootprint()
  let didInflateSynchronously = false

  for (const child of component.children) {
    if (child.componentName !== "Footprint") continue
    const fpChild = child as Footprint
    if (inflatedFootprintInstances.has(fpChild)) continue

    const { src, circuitJson } = fpChild._parsedProps
    if (src === undefined && circuitJson === undefined) continue

    const isWrapperFromLibraryStringFootprint =
      typeof resolvedFootprint === "string" &&
      resolvedFootprint === src &&
      Boolean(parseLibraryFootprintRef(resolvedFootprint))
    if (isWrapperFromLibraryStringFootprint) {
      inflatedFootprintInstances.add(fpChild)
      continue
    }

    inflatedFootprintInstances.add(fpChild)

    if (Array.isArray(circuitJson) && circuitJson.length > 0) {
      inflateCircuitJsonIntoFootprint(
        component,
        fpChild,
        circuitJson as AnyCircuitElement[],
        "",
      )
      didInflateSynchronously = true
    }

    if (src === undefined) continue

    if (Array.isArray(src) && !isReactElement(src)) {
      if (src.length > 0) {
        inflateCircuitJsonIntoFootprint(
          component,
          fpChild,
          src as AnyCircuitElement[],
          "",
        )
        didInflateSynchronously = true
      }
      continue
    }

    if (isReactElement(src)) {
      const subtree = component._renderReactSubtree(src)
      if (subtree.component.componentName === "Footprint") {
        for (const subChild of [...subtree.component.children]) {
          fpChild.add(subChild)
        }
      } else {
        fpChild.add(subtree.component)
      }
      didInflateSynchronously = true
      continue
    }

    if (typeof src !== "string") continue

    const { pcbRotation, pcbPinLabels } = component.props
    const pinLabels = component._resolvePinLabels()
    const fileExtension = getFileExtension(src)
    const footprintParser = fileExtension
      ? component.root?.platform?.footprintFileParserMap?.[fileExtension]
      : null

    if (
      (isHttpUrl(src) || isBlobUrl(src) || isStaticAssetPath(src)) &&
      footprintParser
    ) {
      component._queueAsyncEffect(
        "load-footprint-src-from-platform-file-parser",
        async () => {
          const footprintUrl =
            isHttpUrl(src) || isBlobUrl(src)
              ? src
              : await resolveStaticFileImport(src, component.root?.platform)
          try {
            const result = await footprintParser.loadFromUrl(footprintUrl)
            const fpComponents = createComponentsFromCircuitJson(
              {
                sourcePortOwner: component,
                componentName: component.name ?? component.componentName,
                componentRotation: pcbRotation,
                footprinterString: footprintUrl,
                pinLabels,
                pcbPinLabels,
              },
              result.footprintCircuitJson,
            )
            addInflatedComponentsToFootprint(component, fpChild, fpComponents)
            markComponentPortsDirtyAfterFootprintInflation(component, true)
          } catch (err) {
            recordExternalFootprintLoadError(
              component,
              footprintUrl,
              err,
              "footprint",
            )
            throw err
          }
        },
      )
      continue
    }

    if (isHttpUrl(src)) {
      component._queueAsyncEffect("load-footprint-src-url", async () => {
        try {
          const res = await fetch(src)
          if (!res.ok) {
            throw new Error(`Failed to fetch footprint: ${res.status}`)
          }
          const soup = (await res.json()) as AnyCircuitElement[]
          const fpComponents = createComponentsFromCircuitJson(
            {
              sourcePortOwner: component,
              componentName: component.name ?? component.componentName,
              componentRotation: pcbRotation,
              footprinterString: src,
              pinLabels,
              pcbPinLabels,
            },
            soup,
          )
          addInflatedComponentsToFootprint(component, fpChild, fpComponents)
          markComponentPortsDirtyAfterFootprintInflation(component, true)
        } catch (err) {
          recordExternalFootprintLoadError(
            component,
            src,
            err,
            "external footprint",
          )
          throw err
        }
      })
      continue
    }

    if (isBlobUrl(src)) {
      continue
    }

    const libRef = parseLibraryFootprintRef(src)
    if (libRef) {
      const platform = component.root?.platform
      const footprintLibraryEntry =
        platform?.footprintLibraryMap?.[libRef.footprintLib]
      const configuredFootprintLibraryResolver =
        typeof footprintLibraryEntry === "function"
          ? (footprintLibraryEntry as FootprintLibraryResolver)
          : undefined
      const supplierPartCircuitJsonResolver =
        getSupplierPartCircuitJsonResolver(
          component,
          libRef.footprintLib,
          libRef.footprintName,
        )
      const footprintLibraryResolver =
        configuredFootprintLibraryResolver ?? supplierPartCircuitJsonResolver

      component._queueAsyncEffect("load-footprint-src-lib", async () => {
        try {
          if (!footprintLibraryResolver) {
            throw new Error(
              `No footprint resolver is configured for library "${libRef.footprintLib}".`,
            )
          }
          const result = await footprintLibraryResolver(libRef.footprintName)
          let loadedCircuitJson: AnyCircuitElement[] | null = null
          if (Array.isArray(result)) {
            loadedCircuitJson = result
          } else if (Array.isArray(result.footprintCircuitJson)) {
            loadedCircuitJson =
              result.footprintCircuitJson as AnyCircuitElement[]
          }
          if (!loadedCircuitJson || loadedCircuitJson.length === 0) {
            throw new Error(
              `Footprint resolver returned no circuit elements for "${src}".`,
            )
          }
          const fpComponents = createComponentsFromCircuitJson(
            {
              sourcePortOwner: component,
              componentName: component.name ?? component.componentName,
              componentRotation: pcbRotation,
              footprinterString: src,
              pinLabels,
              pcbPinLabels,
            },
            loadedCircuitJson,
          )
          addInflatedComponentsToFootprint(component, fpChild, fpComponents)
          component._asyncFootprintCadModel =
            (!Array.isArray(result) && result.cadModel) ||
            extractCadModelFromCircuitJson(loadedCircuitJson)
          markComponentPortsDirtyAfterFootprintInflation(component, true)
        } catch (err) {
          recordExternalFootprintLoadError(
            component,
            src,
            err,
            "external footprint",
          )
          throw err
        }
      })
      continue
    }

    let fpCircuitJson: AnyCircuitElement[]
    try {
      fpCircuitJson = fp.string(src).soup() as AnyCircuitElement[]
    } catch (error) {
      reportInvalidFootprintSrcError(component, src, error)
      continue
    }

    const fpComponents = createComponentsFromCircuitJson(
      {
        sourcePortOwner: component,
        componentName: component.name ?? component.componentName,
        componentRotation: pcbRotation,
        footprinterString: src,
        pinLabels,
        pcbPinLabels,
      },
      fpCircuitJson,
    )
    addInflatedComponentsToFootprint(component, fpChild, fpComponents)
    if (component._asyncFootprintCadModel === undefined) {
      component._asyncFootprintCadModel = src
    }
    didInflateSynchronously = true
  }

  if (didInflateSynchronously) {
    markComponentPortsDirtyAfterFootprintInflation(component, false)
  }
}

export function NormalComponent_doInitialResolveFootprintPinLabels(
  component: NormalComponent<any, any>,
) {
  inflateFootprintChildrenIfNeeded(component)
  const pinLabelsBeforeFootprint = component._impliedFootprintPinLabels ?? {}
  const pinLabels: Record<string, string[]> = {}
  const portsFromFootprint = component.getPortsFromFootprint({
    allowImplicitPinNumbers: !component._parsedProps.pinLabels,
  })
  for (const port of portsFromFootprint) {
    const pinNumber = port._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const genericPinLabels = new Set([`pin${pinNumber}`, `${pinNumber}`])
    const labels = port
      .getNameAndAliases()
      .filter((label) => !genericPinLabels.has(label))
    if (labels.length > 0) {
      pinLabels[`pin${pinNumber}`] = labels
    }
  }

  const impliedFootprintPinLabels: Record<string, string[]> = { ...pinLabels }
  for (const [pinKey, labels] of Object.entries(pinLabelsBeforeFootprint)) {
    impliedFootprintPinLabels[pinKey] = Array.isArray(labels)
      ? labels
      : [labels]
  }

  component._impliedFootprintPinLabels = impliedFootprintPinLabels

  if (Object.keys(component._impliedFootprintPinLabels).length === 0) {
    return
  }

  for (const child of component.children) {
    if (child.componentName !== "Port") continue
    const port = child as Port
    const pinNumber = port._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const pinKey = `pin${pinNumber}`
    const labels = component._impliedFootprintPinLabels[pinKey]
    if (!labels) continue
    const labelList = Array.isArray(labels) ? labels : [labels]

    const existingLabels = port.getNameAndAliases()
    for (const label of labelList) {
      if (!existingLabels.includes(label)) {
        port.externallyAddedAliases.push(label)
      }
    }
  }
}
