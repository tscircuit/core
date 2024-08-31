import type { AnySoupElement } from "@tscircuit/soup"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { SilkscreenPath } from "lib/components/primitive-components/SilkscreenPath"

export const createComponentsFromSoup = (
  soup: AnySoupElement[],
): PrimitiveComponent[] => {
  const components: PrimitiveComponent[] = []
  for (const elm of soup) {
    if (elm.type === "pcb_smtpad" && elm.shape === "rect") {
      components.push(
        new SmtPad({
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
          shape: "rect",
          height: elm.height,
          width: elm.width,
          portHints: elm.port_hints,
        }),
      )
    } else if (elm.type === "pcb_smtpad" && elm.shape === "circle") {
      components.push(
        new SmtPad({
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
          shape: "circle",
          radius: elm.radius,
          portHints: elm.port_hints,
        }),
      )
    } else if (elm.type === "pcb_silkscreen_path") {
      components.push(
        new SilkscreenPath({
          layer: elm.layer,
          route: elm.route,
          strokeWidth: elm.stroke_width,
        }),
      )
    }
  }
  return components
}
