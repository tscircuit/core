import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { Diode } from "lib/components/normal-components/Diode"
import { Led } from "lib/components/normal-components/Led"
import { Capacitor } from "lib/components/normal-components/Capacitor"
import { resolveFootprinterPolarity } from "lib/components/base-components/NormalComponent/utils/resolve-footprinter-polarity"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component intent resolves Footprinter strings once without rewriting authored props", async () => {
  const cases = [
    ["Led", "0805", undefined, "diode0805"],
    ["Led", " 0805_pw0.8mm ", undefined, "diode0805_pw0.8mm"],
    ["Chip", "C2040", undefined, "C2040"],
    ["Chip", "sod835", undefined, "sod835"],
    ["Diode", "0603_pw0.8mm", undefined, "diode0603_pw0.8mm"],
    ["Led", "1608_metric", undefined, "diode1608_metric"],
    ["Led", "led0805", undefined, "led0805"],
    ["Led", "smdpads2_p2mm", undefined, "smdpads2_p2mm_anodepin1_cathodepin2"],
    ["Chip", "sod123", undefined, "sod123_nonpolarized"],
    ["Chip", "sod123_nonpolarized", undefined, "sod123_nonpolarized"],
    ["Chip", "cap0805_polarized", undefined, "cap0805_polarized"],
    ["Capacitor", "0805", true, "cap0805_polarized"],
    ["Capacitor", "0805", false, "cap0805_nonpolarized"],
    ["Capacitor", "cap0805_color(red)", true, "cap0805_color(red)_polarized"],
    ["Capacitor", "cap0805_polarized", false, "cap0805_polarized"],
    ["Resistor", "0805", undefined, "0805"],
  ] as const
  for (const [componentName, footprint, polarized, expected] of cases) {
    const input = { componentName, footprint, polarized, name: "PART" }
    const resolved = resolveFootprinterPolarity(input)
    expect(resolved.footprint).toBe(expected)
    expect(
      resolveFootprinterPolarity({ ...input, footprint: resolved.footprint }),
    ).toEqual(resolved)
    expect(input.footprint).toBe(footprint)
  }
  const pinLabels = { pin1: ["cathode"], pin2: ["anode"] }
  const swapped = {
    componentName: "Led",
    footprint: "0805",
    name: "LED_SWAP",
    pinLabels,
  }
  const result = resolveFootprinterPolarity(swapped)
  expect(result.footprint).toBe("diode0805_anodepin2_cathodepin1")
  expect(
    resolveFootprinterPolarity({ ...swapped, footprint: result.footprint }),
  ).toEqual(result)

  const { circuit } = getTestFixture()
  circuit.add(
    <board width={42} height={16} routingDisabled>
      <led name="LED_BARE" footprint="0805" pcbX={-14} />
      <diode name="D_BARE" footprint="0805" pcbX={0} />
      <capacitor
        name="C_POL"
        footprint="0805"
        capacitance="10uF"
        polarized
        pcbX={14}
      />
      <chip name="U_NEUTRAL" footprint="sod123" pcbY={-4.5} />
      <pcbnotetext
        text="Core selects diode0805 / cap0805_polarized; Footprinter supplies artwork"
        pcbY={5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const name of ["LED_BARE", "D_BARE", "C_POL"]) {
    const component = circuit.selectOne(`.${name}`) as Led | Diode | Capacitor
    expect(component.props.footprint).toBe("0805")
    expect(component._parsedProps.footprint).toBe("0805")
    const expected = name === "C_POL" ? "cap0805_polarized" : "diode0805"
    expect(component.resolveFootprint()).toBe(expected)
    expect(component.getFootprinterString()).toBe(expected)
    expect(
      circuit.db.pcb_fabrication_note_path.list({
        pcb_component_id: component.pcb_component_id!,
      }),
    ).toHaveLength(name === "C_POL" ? 3 : 4)
    const pcb = circuit.db.pcb_component.get(component.pcb_component_id!)!
    expect(
      circuit.db.cad_component.getWhere({
        pcb_component_id: pcb.pcb_component_id,
      })!.footprinter_string,
    ).toBe(expected)
  }
  const chip = circuit.selectOne(".U_NEUTRAL") as Chip
  expect(chip.resolveFootprint()).toBe("sod123_nonpolarized")
  const chipFilter = { pcb_component_id: chip.pcb_component_id! }
  expect(circuit.db.pcb_fabrication_note_path.list(chipFilter)).toHaveLength(0)
  expect(circuit.db.pcb_fabrication_note_text.list(chipFilter)).toHaveLength(0)
  for (const footprint of [
    "https://example.com/footprint.json",
    "kicad:Diode_SMD/D_SOD-123",
    "./custom.circuit.json",
  ]) {
    expect(new Chip({ name: "U_EXT", footprint }).resolveFootprint()).toBe(
      footprint,
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
