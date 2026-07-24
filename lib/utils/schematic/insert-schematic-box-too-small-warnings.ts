import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"

const formatMillimeters = (value: number): string =>
  Number(value.toFixed(6)).toString()

const SCHEMATIC_DIMENSION_TOLERANCE_MM = 1e-9

export const insertSchematicBoxTooSmallWarnings = (
  component: NormalComponent<any, any>,
  dimensions: NonNullable<
    ReturnType<NormalComponent<any, any>["_getSchematicBoxDimensions"]>
  >,
): void => {
  const { db } = component.root!
  const { schWidth, schHeight } = component._parsedProps
  const minimumSizeForPins = dimensions.getMinimumSizeForPins()
  const dimensionChecks = [
    {
      propertyName: "schWidth",
      value: schWidth,
      minimumValue: minimumSizeForPins.width,
    },
    {
      propertyName: "schHeight",
      value: schHeight,
      minimumValue: minimumSizeForPins.height,
    },
  ] as const

  for (const { propertyName, value, minimumValue } of dimensionChecks) {
    if (
      value === undefined ||
      value + SCHEMATIC_DIMENSION_TOLERANCE_MM >= minimumValue
    ) {
      continue
    }

    db.source_property_ignored_warning.insert({
      source_component_id:
        component.source_component_id ?? component.source_group_id ?? "",
      property_name: propertyName,
      error_type: "source_property_ignored_warning",
      subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
      message: `${component.getString()} has ${propertyName}=${formatMillimeters(value)}mm, which is too small to display all of its pins. Set ${propertyName} to at least ${formatMillimeters(minimumValue)}mm.`,
    })
  }
}
