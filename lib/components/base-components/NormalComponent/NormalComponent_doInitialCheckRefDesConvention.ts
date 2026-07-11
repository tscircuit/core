import type { NormalComponent } from "./NormalComponent"

const defaultExpectedPrefixesByFtype: Record<string, string[]> = {
  simple_ammeter: ["A"],
  simple_battery: ["B", "BT"],
  simple_capacitor: ["C"],
  simple_chip: ["U", "IC"],
  simple_connector: ["J", "P", "CONN"],
  simple_crystal: ["Y", "X"],
  simple_current_source: ["I", "IS"],
  simple_diode: ["D"],
  simple_fuse: ["F"],
  simple_inductor: ["L", "FB"],
  simple_interconnect: ["ICN"],
  simple_led: ["D", "LED"],
  simple_mosfet: ["Q"],
  simple_op_amp: ["U", "IC"],
  simple_pin_header: ["J", "P", "JP"],
  simple_pinout: ["J", "P"],
  simple_potentiometer: ["RV", "RP"],
  simple_power_source: ["B", "BT", "V", "VS"],
  simple_push_button: ["SW", "S"],
  simple_resistor: ["R"],
  simple_resonator: ["Y", "X"],
  simple_switch: ["SW", "S"],
  simple_test_point: ["TP"],
  simple_transistor: ["Q"],
  simple_voltage_probe: ["VP"],
  simple_voltage_source: ["V", "VS"],
}

export const getDefaultExpectedRefDesPrefixesForFtype = (
  ftype: string | null | undefined,
): string[] | undefined => {
  if (!ftype) return undefined
  return defaultExpectedPrefixesByFtype[ftype]
}

const getRefDesPrefix = (refDes: string): string | undefined =>
  refDes.match(/^[A-Za-z]+/)?.[0]?.toUpperCase()

const refDesPrefixesReservedForNonChipComponents = [
  "J",
  "Q",
  "C",
  "R",
  "L",
  "Y",
  "X",
  "F",
  "S",
  "TP",
]

export const NormalComponent_doInitialCheckRefDesConvention = (
  component: NormalComponent,
) => {
  const { db } = component.root!
  if (!component.source_component_id) return

  const sourceComponent = db.source_component.get(component.source_component_id)
  if (!sourceComponent?.name || !sourceComponent.ftype) return

  const actualPrefix = getRefDesPrefix(sourceComponent.name)
  const isChipUsingReservedPrefix =
    component.componentName === "Chip" &&
    sourceComponent.ftype === "simple_chip" &&
    actualPrefix !== undefined &&
    refDesPrefixesReservedForNonChipComponents.some((prefix) =>
      actualPrefix.startsWith(prefix),
    )

  const expectedPrefixes =
    component.getRefDesPrefixes() ??
    (isChipUsingReservedPrefix
      ? getDefaultExpectedRefDesPrefixesForFtype("simple_chip")
      : undefined)
  if (!expectedPrefixes || expectedPrefixes.length === 0) return

  if (actualPrefix && expectedPrefixes.includes(actualPrefix)) return

  const expectedPrefixMessage =
    expectedPrefixes.length === 1
      ? expectedPrefixes[0]
      : `one of ${expectedPrefixes.join(", ")}`

  db.insert({
    type: "source_refdes_convention_warning",
    warning_type: "source_refdes_convention_warning",
    message: `Component ${sourceComponent.name} has ftype="${sourceComponent.ftype}" but reference designator should start with ${expectedPrefixMessage}`,
    source_component_id: sourceComponent.source_component_id,
    refdes: sourceComponent.name,
    source_component_ftype: sourceComponent.ftype,
    expected_prefixes: expectedPrefixes,
    actual_prefix: actualPrefix,
    subcircuit_id: sourceComponent.subcircuit_id,
  } as any)
}
