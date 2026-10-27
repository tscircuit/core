import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { Diode } from "lib/components/normal-components/Diode"
import { Led } from "lib/components/normal-components/Led"
import { Capacitor } from "lib/components/normal-components/Capacitor"
import { Resistor } from "lib/components/normal-components/Resistor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component intent resolves Footprinter strings once without rewriting authored props", async () => {
  const led = (footprint: string) => new Led({ name: "PART", footprint })
  const diode = (footprint: string) => new Diode({ name: "PART", footprint })
  const genericChip = (footprint: string) =>
    new Chip({ name: "PART", footprint })
  const polarizedCapacitor = (footprint: string) =>
    new Capacitor({
      name: "PART",
      footprint,
      capacitance: "10uF",
      polarized: true,
    })
  const nonpolarizedCapacitor = (footprint: string) =>
    new Capacitor({
      name: "PART",
      footprint,
      capacitance: "10uF",
      polarized: false,
    })
  const cases = [
    [led, "0805", "diode0805"],
    [led, " 0805_pw0.8mm ", "diode0805_pw0.8mm"],
    [genericChip, "C2040", "C2040"],
    [genericChip, "sod835", "sod835"],
    [diode, "0603_pw0.8mm", "diode0603_pw0.8mm"],
    [led, "1608_metric", "diode1608_metric"],
    [led, "led0805", "led0805"],
    [led, "smdpads2_p2mm", "smdpads2_p2mm_anodepin1_cathodepin2"],
    [genericChip, "sod123", "sod123_nonpolarized"],
    [genericChip, "sod123_nonpolarized", "sod123_nonpolarized"],
    [genericChip, "cap0805_polarized", "cap0805_polarized"],
    [polarizedCapacitor, "0805", "cap0805_polarized"],
    [nonpolarizedCapacitor, "0805", "cap0805_nonpolarized"],
    [polarizedCapacitor, "cap0805_color(red)", "cap0805_color(red)_polarized"],
    [nonpolarizedCapacitor, "cap0805_polarized", "cap0805_polarized"],
  ] as const
  for (const [createComponent, footprint, expected] of cases) {
    const component = createComponent(footprint)
    expect(component.resolveFootprint()).toBe(expected)
    expect(component.getFootprinterString()).toBe(expected)
    expect(component.props.footprint).toBe(footprint)
    expect(component._parsedProps.footprint).toBe(footprint)
    const normalized = createComponent(expected)
    expect(normalized.resolveFootprint()).toBe(expected)
    expect(normalized.getFootprinterString()).toBe(expected)
  }
  const resistor = new Resistor({
    name: "R_EXISTING",
    footprint: "0805",
    resistance: "1k",
  })
  expect(resistor.resolveFootprint()).toBe("res0805")
  expect(resistor.getFootprinterString()).toBe("res0805")
  const pinLabels = { pin1: ["cathode"], pin2: ["anode"] }
  const swappedLed = (footprint: string) =>
    new Led({ name: "LED_SWAP", footprint, pinLabels })
  const swapped = swappedLed("0805")
  const swappedDefinition = "diode0805_anodepin2_cathodepin1"
  expect(swapped.resolveFootprint()).toBe(swappedDefinition)
  expect(swapped.getFootprinterString()).toBe(swappedDefinition)
  expect(swapped.props.footprint).toBe("0805")
  expect(swapped._parsedProps.footprint).toBe("0805")
  expect(swapped._parsedProps.pinLabels).toEqual({
    pin1: ["cathode"],
    pin2: ["anode"],
  })
  expect(swappedLed(swappedDefinition).resolveFootprint()).toBe(
    swappedDefinition,
  )

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
