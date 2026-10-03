import type { NormalComponent } from "./NormalComponent"

const passiveFtypes = new Set([
  "simple_resistor",
  "simple_capacitor",
  "simple_inductor",
])

export const NormalComponent_doInitialMissingManufacturerPartNumberWarning = (
  component: NormalComponent,
): void => {
  if (component.props.doNotPlace) return
  const { db } = component.root!
  if (!component.source_component_id) return
  const sourceComponent = db.source_component.get(component.source_component_id)
  if (!sourceComponent || passiveFtypes.has(sourceComponent.ftype)) return
  if (sourceComponent.manufacturer_part_number?.trim()) return
  if (
    db.source_missing_manufacturer_part_number_warning.getWhere({
      source_component_id: component.source_component_id,
    })
  ) {
    return
  }

  const standard =
    sourceComponent.ftype === "simple_connector"
      ? sourceComponent.standard
      : undefined
  db.source_missing_manufacturer_part_number_warning.insert({
    source_component_id: component.source_component_id,
    subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
    standard,
    warning_type: "source_missing_manufacturer_part_number_warning",
    message: `${component.getString()} is missing a manufacturer part number. Specify mpn, manufacturerPartNumber, or mfn.`,
  })
}
