import type { AnySoupElement } from "@tscircuit/soup"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { SmtPad } from "lib/components/primitive-components/SmtPad"

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
    }
  }
  return components
  //   if (elm.type === "pcb_smtpad") {
  //     this.add("smtpad", (pb) => pb.setProps(elm))
  //   } else if (elm.type === "pcb_plated_hole") {
  //     this.add("platedhole", (pb) => pb.setProps(elm))
  //   } else if (elm.type === "pcb_hole") {
  //     this.add("hole", (pb) => pb.setProps(elm))
  //   } else if (elm.type === "pcb_silkscreen_circle") {
  //     this.add("silkscreencircle", (pb) =>
  //       pb.setProps({
  //         ...elm,
  //         pcbX: elm.center.x,
  //         pcbY: elm.center.y,
  //       })
  //     )
  //   } else if (elm.type === "pcb_silkscreen_line") {
  //     this.add("silkscreenline", (pb) =>
  //       pb.setProps({
  //         ...elm,
  //         strokeWidth: elm.stroke_width,
  //       })
  //     )
  //   } else if (elm.type === "pcb_silkscreen_path") {
  //     this.add("silkscreenpath", (pb) =>
  //       pb.setProps({
  //         ...elm,
  //         strokeWidth: elm.stroke_width,
  //       })
  //     )
  //   } else if (elm.type === "pcb_silkscreen_rect") {
  //     this.add("silkscreenrect", (pb) =>
  //       pb.setProps({
  //         ...elm,
  //         pcbX: elm.center.x,
  //         pcbY: elm.center.y,
  //         // TODO silkscreen rect isFilled, isOutline etc.
  //       })
  //     )
  //   } else if (elm.type === "pcb_fabrication_note_path") {
  //     this.add("fabricationnotepath", (pb) => pb.setProps(elm))
  //   } else if (elm.type === "pcb_fabrication_note_text") {
  //     this.add("fabricationnotetext", (pb) =>
  //       pb.setProps({
  //         ...elm,
  //         pcbX: elm.anchor_position.x,
  //         pcbY: elm.anchor_position.y,
  //         anchorAlignment: elm.anchor_alignment,
  //         fontSize: elm.font_size,
  //       })
  //     )
  //   }
}
