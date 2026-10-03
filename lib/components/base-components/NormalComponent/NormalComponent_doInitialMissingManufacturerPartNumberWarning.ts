import type { NormalComponent } from "./NormalComponent"

export const NormalComponent_doInitialMissingManufacturerPartNumberWarning = (
  component: NormalComponent,
): void => {
  const drcChecksDisabled =
    component.root?.platform?.drcChecksDisabled ??
    component.getInheritedProperty("drcChecksDisabled")
  const { db } = component.root!
  if (!component.source_component_id) return
  const sourceComponent = db.source_component.get(component.source_component_id)
  if (!sourceComponent) return
  const existingWarning =
    db.source_missing_manufacturer_part_number_warning.getWhere({
      source_component_id: component.source_component_id,
    })
  const hasSupplierPartNumber = Object.values(
    sourceComponent.supplier_part_numbers ?? {},
  ).some((partNumbers) => partNumbers?.some((partNumber) => partNumber.trim()))
  if (
    drcChecksDisabled ||
    component.props.doNotPlace ||
    sourceComponent.manufacturer_part_number?.trim() ||
    hasSupplierPartNumber
  ) {
    if (existingWarning) {
      db.source_missing_manufacturer_part_number_warning.delete(
        existingWarning.source_missing_manufacturer_part_number_warning_id,
      )
    }
    return
  }
  if (existingWarning) return

  const standard =
    sourceComponent.ftype === "simple_connector"
      ? sourceComponent.standard
      : undefined
  db.source_missing_manufacturer_part_number_warning.insert({
    source_component_id: component.source_component_id,
    subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
    standard,
    warning_type: "source_missing_manufacturer_part_number_warning",
    message: `${component.getString()} is missing a manufacturer part number and could not be resolved to a supplier part. Specify mpn, manufacturerPartNumber, or mfn, provide supplierPartNumbers, or configure a parts engine to select a part.`,
  })
}
