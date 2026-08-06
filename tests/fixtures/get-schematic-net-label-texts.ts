/**
 * Every net name shown on the schematic, however it is drawn.
 *
 * A net name reaches the schematic in one of two forms: an anchored
 * `schematic_net_label` (the tag hanging off the end of a wire), or an inline
 * label - a rotated `schematic_text` running alongside a point-to-point trace.
 * Tests that care about *which name* is displayed should not care which of the
 * two forms it took.
 *
 * Text owned by a component (reference designators, values) is excluded, but
 * other free-standing schematic text - a section title, say - is not
 * distinguishable from an inline label here.
 */
export const getSchematicNetLabelTexts = (circuit: {
  db: {
    schematic_net_label: { list: () => Array<{ text: string }> }
    schematic_text: {
      list: () => Array<{ text: string; schematic_component_id?: string }>
    }
  }
}): string[] =>
  [
    ...circuit.db.schematic_net_label.list().map((label) => label.text),
    ...circuit.db.schematic_text
      .list()
      .filter((text) => !text.schematic_component_id)
      .map((text) => text.text),
  ].filter(Boolean)
