import type { AnyCircuitElement } from "circuit-json"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { SilkscreenPath } from "lib/components/primitive-components/SilkscreenPath"
import { PlatedHole } from "lib/components/primitive-components/PlatedHole"
import { Keepout } from "lib/components/primitive-components/Keepout"
import { SolderPaste } from "lib/components/primitive-components/SolderPaste"

export const createComponentsFromSoup = (
  soup: AnyCircuitElement[],
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
    } else if (elm.type === "pcb_solder_paste" && elm.shape === "circle") {
      components.push(
        new SolderPaste({
          radius: elm.radius,
          shape: "circle",
          layer: elm.layer,
          pcbX: elm.x,
          pcbY: elm.y,
        }),
      )
    } else if (elm.type === "pcb_solder_paste" && elm.shape === "rect") {
      components.push(
        new SolderPaste({
          height: elm.height,
          width: elm.width,
          shape: "rect",
          layer: elm.layer,
          pcbX: elm.x,
          pcbY: elm.y,
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
    } else if (elm.type === "pcb_plated_hole" && elm.shape === "circle") {
      if (elm.shape === "circle") {
        components.push(
          new PlatedHole({
            pcbX: elm.x,
            pcbY: elm.y,
            shape: "circle",
            holeDiameter: elm.hole_diameter,
            outerDiameter: elm.outer_diameter,
            portHints: elm.port_hints,
          }),
        )
      }
    } else if (elm.type === "pcb_keepout" && elm.shape === "circle") {
      components.push(
        new Keepout({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          shape: "circle",
          radius: elm.radius,
        }),
      )
    } else if (elm.type === "pcb_keepout" && elm.shape === "rect") {
      components.push(
        new Keepout({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          shape: "rect",
          width: elm.width,
          height: elm.height,
        }),
      )
    }
  }
  return components
}
