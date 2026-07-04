import type { NormalComponent } from "./NormalComponent"

const expectedPrefixesByFtype: Record<string, string[]> = {
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

const getRefdesPrefix = (refdes: string): string | undefined =>
  refdes.match(/^[A-Za-z]+/)?.[0]?.toUpperCase()

export const NormalComponent_doInitialSourceRefdesConventionWarning = (
  component: NormalComponent,
) => {
  const { db } = component.root!
  if (!component.source_component_id) return

  const sourceComponent = db.source_component.get(component.source_component_id)
  if (!sourceComponent?.name || !sourceComponent.ftype) return

  const expectedPrefixes = expectedPrefixesByFtype[sourceComponent.ftype]
  if (!expectedPrefixes) return

  const actualPrefix = getRefdesPrefix(sourceComponent.name)
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
