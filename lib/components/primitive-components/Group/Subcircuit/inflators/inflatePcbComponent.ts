import type { SourceComponentBase, PcbComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

export const inflatePcbComponent = (
  pcbElm: PcbComponent,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, normalComponent } = inflatorContext
  if (!normalComponent) return

  // Get the component center and rotation to make primitive positions relative
  const componentCenter = pcbElm.center || { x: 0, y: 0 }
  const componentRotation = pcbElm.rotation || 0 // rotation in degrees

  // Helper function to rotate a point by an angle (in degrees)
  const rotatePoint = (
    x: number,
    y: number,
    angleDeg: number,
  ): { x: number; y: number } => {
    const angleRad = (angleDeg * Math.PI) / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos,
    }
  }

  // Helper function to transform a point to component-relative coordinates
  const transformPoint = (x: number, y: number): { x: number; y: number } => {
    // Translate to origin
    const translated = {
      x: x - componentCenter.x,
      y: y - componentCenter.y,
    }
    // Rotate by negative of component rotation to get to component local frame
    return rotatePoint(translated.x, translated.y, -componentRotation)
  }

  // Transform primitive positions to be relative to component center
  const relativeElements = injectionDb
    .toArray()
    .filter(
      (elm) =>
        "pcb_component_id" in elm &&
        elm.pcb_component_id === pcbElm.pcb_component_id,
    )
    .map((elm: any) => {
      // Handle elements with x, y properties (holes, pads)
      if (
        "x" in elm &&
        "y" in elm &&
        typeof elm.x === "number" &&
        typeof elm.y === "number"
      ) {
        const transformed = transformPoint(elm.x, elm.y)
        const result: any = {
          ...elm,
          x: transformed.x,
          y: transformed.y,
        }
        // Adjust element's own rotation if it exists
        if ("ccw_rotation" in elm && typeof elm.ccw_rotation === "number") {
          result.ccw_rotation = elm.ccw_rotation - componentRotation
        }
        return result
      }

      // Handle elements with center property (keepout, cutout)
      if (
        "center" in elm &&
        elm.center &&
        typeof elm.center.x === "number" &&
        typeof elm.center.y === "number"
      ) {
        const transformed = transformPoint(elm.center.x, elm.center.y)
        return {
          ...elm,
          center: {
            x: transformed.x,
            y: transformed.y,
          },
        }
      }

      // Handle elements with anchor_position (silkscreen text)
      if ("anchor_position" in elm && elm.anchor_position) {
        const transformed = transformPoint(
          elm.anchor_position.x,
          elm.anchor_position.y,
        )
        return {
          ...elm,
          anchor_position: {
            x: transformed.x,
            y: transformed.y,
          },
        }
      }

      // Handle elements with route arrays (silkscreen paths, traces)
      if ("route" in elm && Array.isArray(elm.route)) {
        return {
          ...elm,
          route: elm.route.map((point: any) => {
            const transformed = transformPoint(point.x, point.y)
            return {
              ...point,
              x: transformed.x,
              y: transformed.y,
            }
          }),
        }
      }

      // Handle elements with points arrays (polygon cutouts)
      if ("points" in elm && Array.isArray(elm.points)) {
        return {
          ...elm,
          points: elm.points.map((point: any) => {
            const transformed = transformPoint(point.x, point.y)
            return {
              ...point,
              x: transformed.x,
              y: transformed.y,
            }
          }),
        }
      }

      return elm
    })

  const components = createComponentsFromCircuitJson(
    {
      componentName: normalComponent.name,
      componentRotation: "0deg",
    },
    relativeElements,
  )

  // Mark the component as inflated from circuit JSON so size calculation preserves center
  ;(normalComponent as any)._inflatedFromCircuitJson = true

  normalComponent.addAll(components)
}
