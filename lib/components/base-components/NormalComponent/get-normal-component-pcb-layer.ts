import type { LayerRef } from "circuit-json"
import { isValidElement } from "react"

interface NormalComponentLayerSource {
  children: Array<{
    componentName: string
    _parsedProps: {
      originalLayer?: LayerRef
    }
  }>
  props: {
    footprint?: unknown
  }
  _parsedProps: {
    layer?: LayerRef
  }
}

const getFootprintOriginalLayer = (
  normalComponent: NormalComponentLayerSource,
): LayerRef | undefined => {
  const footprintChild = normalComponent.children.find(
    (child) => child.componentName === "Footprint",
  )
  if (footprintChild) return footprintChild._parsedProps.originalLayer

  const footprint = normalComponent.props.footprint
  if (isValidElement(footprint)) {
    return (footprint.props as { originalLayer?: LayerRef }).originalLayer
  }

  if (
    footprint &&
    typeof footprint === "object" &&
    "componentName" in footprint &&
    footprint.componentName === "Footprint"
  ) {
    const footprintComponent = footprint as {
      props?: { originalLayer?: LayerRef }
      _parsedProps?: { originalLayer?: LayerRef }
    }
    return (
      footprintComponent._parsedProps?.originalLayer ??
      footprintComponent.props?.originalLayer
    )
  }

  return undefined
}

export const getNormalComponentPcbLayer = (
  normalComponent: NormalComponentLayerSource,
): LayerRef =>
  normalComponent._parsedProps.layer ??
  (getFootprintOriginalLayer(normalComponent) === "bottom" ? "bottom" : "top")
