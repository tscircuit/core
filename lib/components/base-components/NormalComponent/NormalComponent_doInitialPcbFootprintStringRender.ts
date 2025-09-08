import { NormalComponent } from "./NormalComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { isValidElement as isReactElement } from "react"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { isFootprintUrl } from "./utils/isFoorprintUrl"
import { parseLibraryFootprintRef } from "./utils/parseLibraryFootprintRef"

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
      const res = await fetch(url)
      const soup = await res.json()
      const fpComponents = createComponentsFromCircuitJson(
        {
          componentName: component.name,
          componentRotation: pcbRotation,
          footprint: url,
          pinLabels,
          pcbPinLabels,
          allowOnlyRefSilkscreenForImportedFootprint: true,
        },
        soup as any,
      )
      component.addAll(fpComponents)
      component._markDirty("InitializePortsFromChildren")
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
    let resolverFn: ((path: string) => Promise<any>) | undefined
    if (typeof libMap === "function") {
      resolverFn = libMap as (path: string) => Promise<any>
    }

    if (!resolverFn) return

    queueAsyncEffect("load-lib-footprint", async () => {
      const result = await resolverFn!(libRef.footprintName)
      const circuitJson = Array.isArray(result)
        ? result
        : Array.isArray((result as any)?.footprintCircuitJson)
          ? (result as any).footprintCircuitJson
          : null
      if (!circuitJson) return
      const fpComponents = createComponentsFromCircuitJson(
        {
          componentName: component.name,
          componentRotation: pcbRotation,
          footprint,
          pinLabels,
          pcbPinLabels,
          allowOnlyRefSilkscreenForImportedFootprint: true,
        },
        circuitJson,
      )
      component.addAll(fpComponents)
      // Ensure existing Ports re-run PcbPortRender now that pads exist
      for (const child of component.children) {
        if (child.componentName === "Port") {
          child._markDirty?.("PcbPortRender")
        }
      }
      component._markDirty("InitializePortsFromChildren")
    })
    return
  }

  if (isReactElement(footprint)) {
    if (component.reactSubtrees.some((rs) => rs.element === footprint)) return
    const subtree = component._renderReactSubtree(footprint)
    component.reactSubtrees.push(subtree)
    component.add(subtree.component)
    return
  }

  if (
    !isReactElement(footprint) &&
    (footprint as Footprint).componentName === "Footprint"
  ) {
    component.add(footprint as Footprint)
  }
}
