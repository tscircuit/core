import {
  type FootprintLibraryResult,
  type PartsEngine,
  type SupplierName,
  type SupplierPartNumbers,
  supplierProps,
} from "@tscircuit/props"
import {
  type AnyCircuitElement,
  circuit_json_footprint_load_error,
  external_footprint_load_error,
} from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { extractCadModelFromCircuitJson } from "lib/utils/connectors/extractCadModelFromCircuitJson"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { resolveStaticFileImport } from "lib/utils/resolveStaticFileImport"
import { isValidElement as isReactElement } from "react"
import * as Effect from "effect/Effect"
import { corePromise, coreSync } from "lib/effect/core-error"
import { loadCircuitJsonFootprint } from "lib/effect/loading"
import { NormalComponent } from "./NormalComponent"
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

const shouldAddOutsideFootprintWrapper = (footprintChild: PrimitiveComponent) =>
  footprintChild.componentName === "Symbol" ||
  footprintChild.isSchematicPrimitive

function recordFootprintLoadError(
  component: NormalComponent<any, any>,
  {
    footprint,
    cause,
    external = true,
  }: {
    footprint: string
    cause: unknown
    external?: boolean
  },
) {
  const db = component.root?.db
  if (!db || !component.source_component_id || !component.pcb_component_id)
    return
  db.external_footprint_load_error.insert(
    external_footprint_load_error.parse({
      type: "external_footprint_load_error",
      message: `${component.getString()} failed to load ${external ? "external " : ""}footprint "${footprint}": ${cause instanceof Error ? cause.message : String(cause)}`,
      pcb_component_id: component.pcb_component_id,
      source_component_id: component.source_component_id,
      subcircuit_id: component.getSubcircuit().subcircuit_id ?? undefined,
      pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
      footprinter_string: footprint,
    }),
  )
}

function getSupplierPartCircuitJsonResolver(
  component: NormalComponent<any, any>,
  {
    footprintLibrary,
    footprintName,
  }: {
    footprintLibrary: string
    footprintName: string
  },
): FootprintLibraryResolver | undefined {
  if (component.getInheritedProperty("partsEngineDisabled")) return
  const supplierPartNumbers = component.props.supplierPartNumbers as
    | SupplierPartNumbers
    | undefined
  const supplierName = supplierNames.find((name) => name === footprintLibrary)
  if (
    !supplierName ||
    !supplierPartNumbers?.[supplierName]?.includes(footprintName)
  )
    return
  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  const fetchPartCircuitJson = partsEngine?.fetchPartCircuitJson
  if (!fetchPartCircuitJson) return
  return async (supplierPartNumber) => ({
    footprintCircuitJson:
      (await fetchPartCircuitJson({
        supplierPartNumber,
        // Keep the exact legacy callback transport. PartsEngine has no signal;
        // interruption abandons its wait and suppresses all later mutations.
        platformFetch: component.root?.platform?.platformFetch,
      })) ?? [],
  })
}

function commitFootprintChildren(
  component: NormalComponent<any, any>,
  {
    footprintChildren,
    dirtyExistingPorts = false,
  }: {
    footprintChildren: PrimitiveComponent[]
    dirtyExistingPorts?: boolean
  },
) {
  component.addAll(footprintChildren)
  if (dirtyExistingPorts) {
    for (const child of component.children) {
      if (child.componentName === "Port") child._markDirty("PcbPortRender")
    }
  }
  component._markDirty("ResolveFootprintPinLabels")
  component._markDirty("InitializePortsFromChildren")
}

export function NormalComponent_doInitialPcbFootprintStringRender(
  component: NormalComponent<any, any>,
) {
  const footprint = component.resolveFootprint()
  if (!footprint) return
  const { pcbRotation, pcbPinLabels } = component.props
  const pinLabels = component._resolvePinLabels()
  const importFootprint = (
    footprintUrl: string,
    circuitJson: AnyCircuitElement[],
  ) =>
    createComponentsFromCircuitJson(
      {
        componentName: component.name,
        componentRotation: pcbRotation,
        footprinterString: footprintUrl,
        pinLabels,
        pcbPinLabels,
      },
      circuitJson,
    )
  const fileExtension = getFileExtension(String(footprint))
  const footprintParser = fileExtension
    ? component.root?.platform?.footprintFileParserMap?.[fileExtension]
    : null

  if (
    typeof footprint === "string" &&
    (isHttpUrl(footprint) ||
      isBlobUrl(footprint) ||
      isStaticAssetPath(footprint)) &&
    footprintParser
  ) {
    if (component._hasStartedFootprintUrlLoad) return
    component._hasStartedFootprintUrlLoad = true
    component._queueEffect("load-footprint-from-platform-file-parser", (job) =>
      Effect.gen(function* () {
        const footprintUrl =
          isHttpUrl(footprint) || isBlobUrl(footprint)
            ? footprint
            : // Resolver/parser contracts have no signal; Effect interrupts the wait
              // and job.commit prevents their noncooperative results from attaching.
              yield* corePromise(
                () =>
                  resolveStaticFileImport(footprint, component.root?.platform),
                "resolve_footprint_asset",
              )
        yield* Effect.gen(function* () {
          const result = yield* corePromise(
            () => footprintParser.loadFromUrl(footprintUrl),
            "parse_footprint",
          )
          const footprintChildren = yield* coreSync(
            () => importFootprint(footprintUrl, result.footprintCircuitJson),
            "create_footprint_children",
          )
          yield* coreSync(
            () =>
              job.commit(() =>
                commitFootprintChildren(component, {
                  footprintChildren,
                  dirtyExistingPorts: true,
                }),
              ),
            "commit_footprint",
          )
        }).pipe(
          Effect.catch((error) =>
            coreSync(() =>
              job.commit(() =>
                recordFootprintLoadError(component, {
                  footprint: footprintUrl,
                  cause: error.cause,
                  external: false,
                }),
              ),
            ).pipe(Effect.andThen(Effect.fail(error))),
          ),
        )
      }),
    )
    return
  }

  if (typeof footprint === "string" && isHttpUrl(footprint)) {
    if (component._hasStartedFootprintUrlLoad) return
    component._hasStartedFootprintUrlLoad = true
    const footprintLoader = component.root?.experimentalFootprintLoader
    component._queueEffect("load-footprint-url", (job) => {
      const request = {
        url: footprint,
        isCurrent: () =>
          job.isCurrent() && component.resolveFootprint() === footprint,
        decode: async (response: Response) =>
          importFootprint(footprint, await response.json()),
        commit: (footprintChildren: PrimitiveComponent[]) => {
          job.commit(() =>
            commitFootprintChildren(component, { footprintChildren }),
          )
        },
        onError: (cause: unknown) => {
          job.commit(() =>
            recordFootprintLoadError(component, { footprint, cause }),
          )
        },
      }
      if (footprintLoader)
        return footprintLoader.loadInScope(component, { request, job })
      return Effect.gen(function* () {
        const circuitJson = yield* loadCircuitJsonFootprint(footprint)
        const footprintChildren = yield* coreSync(
          () => importFootprint(footprint, circuitJson),
          "create_footprint_children",
        )
        yield* coreSync(
          () =>
            job.commit(() => {
              if (component.resolveFootprint() === footprint)
                commitFootprintChildren(component, { footprintChildren })
            }),
          "commit_footprint",
        )
      }).pipe(
        Effect.catch((error) =>
          coreSync(() =>
            job.commit(() =>
              recordFootprintLoadError(component, {
                footprint,
                cause: error.cause,
              }),
            ),
          ).pipe(Effect.andThen(Effect.fail(error))),
        ),
      )
    })
    return
  }
  if (typeof footprint === "string" && isBlobUrl(footprint)) return

  if (typeof footprint === "string") {
    const libRef = parseLibraryFootprintRef(footprint)
    if (!libRef || component._hasStartedFootprintUrlLoad) return
    component._hasStartedFootprintUrlLoad = true
    component._queueEffect("load-lib-footprint", (job) =>
      Effect.gen(function* () {
        const libraryEntry =
          component.root?.platform?.footprintLibraryMap?.[libRef.footprintLib]
        const resolver =
          typeof libraryEntry === "function"
            ? (libraryEntry as FootprintLibraryResolver)
            : getSupplierPartCircuitJsonResolver(component, {
                footprintLibrary: libRef.footprintLib,
                footprintName: libRef.footprintName,
              })
        const result = yield* corePromise(() => {
          if (!resolver)
            throw new Error(
              `No footprint resolver is configured for library "${libRef.footprintLib}".`,
            )
          // Library callbacks have no cancellation parameter in PlatformConfig.
          return resolver(libRef.footprintName)
        }, "resolve_library_footprint")
        const circuitJson = Array.isArray(result)
          ? result
          : result.footprintCircuitJson
        if (!Array.isArray(circuitJson) || circuitJson.length === 0) {
          return yield* coreSync(() => {
            throw new Error(
              `Footprint resolver returned no circuit elements for "${footprint}".`,
            )
          })
        }
        const footprintChildren = yield* coreSync(
          () => importFootprint(footprint, circuitJson),
          "create_footprint_children",
        )
        const cadModel =
          (!Array.isArray(result) && result.cadModel) ||
          extractCadModelFromCircuitJson(circuitJson)
        yield* coreSync(
          () =>
            job.commit(() => {
              const footprintWrapper = new Footprint({ src: footprint })
              const childrenOutsideFootprint: PrimitiveComponent[] = []
              for (const child of footprintChildren) {
                if (shouldAddOutsideFootprintWrapper(child))
                  childrenOutsideFootprint.push(child)
                else footprintWrapper.add(child)
              }
              component._asyncFootprintCadModel = cadModel
              commitFootprintChildren(component, {
                footprintChildren: [
                  footprintWrapper,
                  ...childrenOutsideFootprint,
                ],
                dirtyExistingPorts: true,
              })
            }),
          "commit_library_footprint",
        )
      }).pipe(
        Effect.catch((error) =>
          coreSync(() =>
            job.commit(() =>
              recordFootprintLoadError(component, {
                footprint,
                cause: error.cause,
              }),
            ),
          ).pipe(Effect.andThen(Effect.fail(error))),
        ),
      ),
    )
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
