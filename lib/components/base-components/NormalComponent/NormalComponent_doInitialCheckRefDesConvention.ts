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

const chipRefDesRecommendations = [
  { prefix: "J", recommendation: "a <connector /> or <jumper />" },
  { prefix: "Q", recommendation: "a <transistor />" },
  { prefix: "C", recommendation: "a <capacitor />" },
  { prefix: "R", recommendation: "a <resistor />" },
  { prefix: "L", recommendation: "an <inductor />" },
  { prefix: "Y", recommendation: "a <crystal />" },
  { prefix: "X", recommendation: "a <crystal />" },
  { prefix: "F", recommendation: "a <fuse />" },
  { prefix: "S", recommendation: "a <switch /> or <pushbutton />" },
  { prefix: "TP", recommendation: "a <testpoint />" },
]

export const NormalComponent_doInitialCheckRefDesConvention = (
  component: NormalComponent,
) => {
  const { db } = component.root!
  if (!component.source_component_id) return

  const sourceComponent = db.source_component.get(component.source_component_id)
  if (!sourceComponent?.name || !sourceComponent.ftype) return

  const actualPrefix = getRefDesPrefix(sourceComponent.name)
  const chipRefDesRecommendation =
    component.componentName === "Chip" &&
    sourceComponent.ftype === "simple_chip" &&
    actualPrefix !== undefined
      ? chipRefDesRecommendations.find(({ prefix }) =>
          actualPrefix.startsWith(prefix),
        )
      : undefined

  const expectedPrefixes =
    component.getRefDesPrefixes() ??
    (chipRefDesRecommendation
      ? getDefaultExpectedRefDesPrefixesForFtype("simple_chip")
      : undefined)
  if (!expectedPrefixes || expectedPrefixes.length === 0) return

  if (actualPrefix && expectedPrefixes.includes(actualPrefix)) return

  const expectedPrefixMessage =
    expectedPrefixes.length === 1
      ? expectedPrefixes[0]
      : `one of ${expectedPrefixes.join(", ")}`
  const message = chipRefDesRecommendation
    ? `The "${chipRefDesRecommendation.prefix}" prefix is being used with a <chip />, try using it with ${chipRefDesRecommendation.recommendation}`
    : `Component ${sourceComponent.name} has ftype="${sourceComponent.ftype}" but reference designator should start with ${expectedPrefixMessage}`

  db.insert({
    type: "source_refdes_convention_warning",
    warning_type: "source_refdes_convention_warning",
    message,
    source_component_id: sourceComponent.source_component_id,
    refdes: sourceComponent.name,
    source_component_ftype: sourceComponent.ftype,
    expected_prefixes: expectedPrefixes,
    actual_prefix: actualPrefix,
    subcircuit_id: sourceComponent.subcircuit_id,
  } as any)
}
