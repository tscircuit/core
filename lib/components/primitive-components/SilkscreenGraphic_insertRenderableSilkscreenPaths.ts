import { getTransformedSvgPathRoutes } from "@tscircuit/image-utils"
import type { SilkscreenGraphic } from "./SilkscreenGraphic"

export const SilkscreenGraphic_insertRenderableSilkscreenPaths = ({
  component,
  layer,
  svg,
}: {
  component: SilkscreenGraphic
  layer: "top" | "bottom"
  svg: string
}): void => {
  const { db } = component.root!
  const { _parsedProps: props } = component
  const transform = component._computePcbGlobalTransformBeforeLayout()
  const pcbComponentId =
    component.parent?.pcb_component_id ??
    component.getPrimitiveContainer()?.pcb_component_id ??
    ""

  for (const route of getTransformedSvgPathRoutes({
    svg,
    width: props.width,
    height: props.height,
    transform,
  })) {
    if (route.length < 2) continue

    const path = db.pcb_silkscreen_path.insert({
      pcb_component_id: pcbComponentId,
      layer,
      route,
      stroke_width: Math.max(Math.min(props.width, props.height) / 60, 0.05),
      subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
      pcb_group_id: component.getGroup()?.pcb_group_id ?? undefined,
    })
    component.pcb_silkscreen_path_ids.push(path.pcb_silkscreen_path_id)
  }
}
