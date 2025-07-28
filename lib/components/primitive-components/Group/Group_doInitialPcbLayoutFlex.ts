import type { Group } from "./Group"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import { layoutCircuitJsonWithFlex } from "@tscircuit/circuit-json-flex"
import type { PcbSmtPad, PcbSilkscreenText } from "circuit-json"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"

export const Group_doInitialPcbLayoutFlex = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  // Use whole circuit JSON if this group is a board subcircuit, otherwise build subtree
  const circuitJson =
    group.lowercaseComponentName === "board"
      ? db.toArray()
      : buildSubtree(db.toArray(), {
          source_group_id: group.source_group_id!,
        })

  const justify = props.pcbJustifyContent ?? props.justifyContent
  const align = props.pcbAlignItems ?? props.alignItems
  const modifiedCircuitJson = layoutCircuitJsonWithFlex(circuitJson, {
    justifyContent:
      justify === "start"
        ? "flex-start"
        : justify === "end"
          ? "flex-end"
          : justify === "stretch"
            ? "space-between"
            : justify,
    alignItems:
      align === "start"
        ? "flex-start"
        : align === "end"
          ? "flex-end"
          : (align ?? "center"),
  })

  const pcbSmtPads = db.pcb_smtpad.list()
  for (const smtpad of pcbSmtPads) {
    const modifiedElm = modifiedCircuitJson.find(
      (elm) =>
        elm.type === "pcb_smtpad" && elm.pcb_smtpad_id === smtpad.pcb_smtpad_id,
    ) as PcbSmtPad
    if (!modifiedElm) continue
    db.pcb_smtpad.update(smtpad.pcb_smtpad_id, modifiedElm)
  }

  const pcbSilkScreenTexts = db.pcb_silkscreen_text.list()
  for (const silkscreenText of pcbSilkScreenTexts) {
    const modifiedElm = modifiedCircuitJson.find(
      (elm) =>
        elm.type === "pcb_silkscreen_text" &&
        elm.pcb_silkscreen_text_id === silkscreenText.pcb_silkscreen_text_id,
    ) as PcbSilkscreenText
    if (!modifiedElm) continue
    db.pcb_silkscreen_text.update(
      silkscreenText.pcb_silkscreen_text_id,
      modifiedElm,
    )
  }

  /**
   * After applying flex positioning we need to update the size of the
   * corresponding pcb_group so that non-subcircuit groups (as well as
   * subcircuits) report correct width/height.  We simply recompute the bounds
   * of all child PCB primitives/components now that they have moved.
   */
  if (group.pcb_group_id) {
    const bounds = getBoundsOfPcbComponents(group.children as any)

    if (bounds.width > 0 && bounds.height > 0) {
      const center = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      }

      db.pcb_group.update(group.pcb_group_id, {
        width: bounds.width,
        height: bounds.height,
        center,
      })
    }
  }
}
