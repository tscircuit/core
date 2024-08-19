import type { AnySoupElement } from "@tscircuit/soup"
import type { BaseComponent } from "../components/BaseComponent"
// import { } from "../components/

export const createComponentsFromSoup = (
  soup: AnySoupElement[],
): BaseComponent[] => {
  return [new PcbSmtPad()]
  // for (const elm of soup) {
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
