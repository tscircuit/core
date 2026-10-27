import { expect, test } from "bun:test"
import type { Diode } from "lib/components/normal-components/Diode"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CustomPads = () => (
  <footprint>
    <smtpad
      shape="rect"
      width={0.8}
      height={0.8}
      pcbX={-1.2}
      portHints={["1"]}
    />
    <smtpad
      shape="rect"
      width={0.8}
      height={0.8}
      pcbX={1.2}
      portHints={["2"]}
    />
  </footprint>
)

test("core marks typed polarized components across footprint sources and leaves neutral parts alone", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    { name: "LED_BARE", kind: "led", footprint: "0603", x: -21, y: 12 },
    {
      name: "LED_GENERIC",
      kind: "led",
      footprint: "smdpads2_p2.4mm_pw0.8mm_ph0.8mm",
      x: -7,
      y: 12,
    },
    { name: "LED_NAMED", kind: "led", footprint: "led0805", x: 7, y: 12 },
    { name: "D_BARE", kind: "diode", footprint: "0603", x: -21, y: 0 },
    {
      name: "D_GENERIC",
      kind: "diode",
      footprint: "smdpads2_p2.4mm_pw0.8mm_ph0.8mm",
      x: -7,
      y: 0,
    },
    { name: "D_NAMED", kind: "diode", footprint: "sod123", x: 7, y: 0 },
  ] as const
  circuit.add(
    <board width={62} height={44} routingDisabled>
      {cases.map((c) => {
        const props = {
          name: c.name,
          footprint: c.footprint,
          pcbX: c.x,
          pcbY: c.y,
          pinLabels: { pin1: ["cathode"], pin2: ["anode"] },
        }
        return c.kind === "led" ? (
          <led key={c.name} {...props} />
        ) : (
          <diode key={c.name} {...props} />
        )
      })}
      <led
        name="LED_CUSTOM"
        pcbX={21}
        pcbY={12}
        pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
      >
        <CustomPads />
      </led>
      <diode
        name="D_CUSTOM"
        pcbX={21}
        pcbY={0}
        pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
      >
        <CustomPads />
      </diode>
      <capacitor
        name="C_POLAR"
        capacitance="10uF"
        polarized
        footprint="cap0805"
        pcbX={-21}
        pcbY={-12}
      />
      <capacitor
        name="C_NEUTRAL"
        capacitance="10uF"
        footprint="cap0805"
        pcbX={-7}
        pcbY={-12}
      />
      <resistor
        name="R_NEUTRAL"
        resistance={1000}
        footprint="0603"
        pcbX={7}
        pcbY={-12}
      />
      {/* A mechanical diode package does not make a generic chip polarized. */}
      <chip
        name="U_GENERIC"
        footprint="sod882"
        pcbX={21}
        pcbY={-12}
        pinLabels={{ pin1: ["positive"], pin2: ["negative"] }}
      />
      <pcbnotetext text="LED_CUSTOM" pcbX={21} pcbY={15} fontSize={0.4} />
      <pcbnotetext text="D_CUSTOM" pcbX={21} pcbY={3} fontSize={0.4} />
      <pcbnotetext
        text="Core: one mark for LED/diode/polarized capacitor; none for neutral components"
        pcbY={19}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const name of [...cases.map((c) => c.name), "LED_CUSTOM", "D_CUSTOM"]) {
    const diode = circuit.selectOne(`.${name}`) as Diode | Led
    const filter = { pcb_component_id: diode.pcb_component_id! }
    expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(4)
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(0)
    const pads = circuit.db.pcb_smtpad.list(filter)
    diode.updatePcbComponentSizeCalculation()
    expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(4)
    expect(circuit.db.pcb_smtpad.list(filter)).toEqual(pads)
  }
  for (const [name, expected] of [
    ["C_POLAR", 3],
    ["C_NEUTRAL", 0],
    ["R_NEUTRAL", 0],
    ["U_GENERIC", 0],
  ] as const) {
    const source = circuit.db.source_component.getWhere({ name })!
    const pcb = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    expect(
      circuit.db.pcb_fabrication_note_path.list({
        pcb_component_id: pcb.pcb_component_id,
      }),
    ).toHaveLength(expected)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
