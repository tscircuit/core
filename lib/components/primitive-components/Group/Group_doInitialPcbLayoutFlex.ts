import type { Group } from "./Group"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import { layoutCircuitJsonWithFlex } from "@tscircuit/circuit-json-flex"
import type { PcbSmtPad, PcbSilkscreenText } from "circuit-json"

export const Group_doInitialPcbLayoutFlex = (group: Group) => {
  const { db } = group.root!

  const subtreeCircuitJson = buildSubtree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  const modifiedCircuitJson = layoutCircuitJsonWithFlex(subtreeCircuitJson, {
    justifyContent: "space-between",
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
}
