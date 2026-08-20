import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("repro126-knockout-rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="J1"
        footprint="pinrow2"
        manufacturerPartNumber="Adapter"
        pinLabels={{
          pin1: "DC_PLUS",
          pin2: "GND",
        }}
        schX={-5.5}
        schY={1.35}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2"],
          },
        }}
        connections={{
          pin1: sel.net().IN,
          pin2: sel.net.GND,
        }}
      />

      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0603"
        schX={-2.75}
        schY={0.75}
        schRotation="270deg"
        connections={{
          pin1: sel.net().IN,
          pin2: sel.net.GND,
        }}
      />

      <capacitor
        name="C2"
        capacitance="4.7uF"
        footprint="0603"
        schX={3.2}
        schY={0.6}
        schRotation="270deg"
        connections={{
          pin1: sel.net().OUT,
          pin2: sel.net.GND,
        }}
      />

      <chip
        name="BT1"
        footprint="pinrow3"
        manufacturerPartNumber="Battery Pack"
        pinLabels={{
          pin1: "TEMP",
          pin2: "PACK_PLUS",
          pin3: "PACK_MINUS",
        }}
        schX={-6.0}
        schY={-2.9}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3"],
          },
        }}
        connections={{
          pin1: sel.net().TS,
          pin2: sel.net().BAT,
          pin3: sel.net.GND,
        }}
      />

      <capacitor
        name="C3"
        capacitance="4.7uF"
        footprint="0603"
        pcbX={-2}
        pcbY={-2.7}
        schX={-2.35}
        schY={-2.7}
        schRotation="270deg"
        connections={{
          pin1: sel.net().BAT,
          pin2: sel.net.GND,
        }}
      />

      <resistor
        name="R1"
        resistance="4.12k"
        footprint="0603"
        schX={-1.1}
        schY={-3.75}
        schRotation="270deg"
        connections={{
          pin1: sel.net().ITERM,
          pin2: sel.net.GND,
        }}
      />

      <resistor
        name="R2"
        resistance="1.18k"
        footprint="0603"
        schX={0}
        schY={-3.75}
        schRotation="270deg"
        connections={{
          pin1: sel.net().ILIM,
          pin2: sel.net.GND,
        }}
      />

      <resistor
        name="R3"
        resistance="1.13k"
        footprint="0603"
        schX={1.1}
        schY={-3.75}
        schRotation="270deg"
        connections={{
          pin1: sel.net().ISET,
          pin2: sel.net.GND,
        }}
      />

      <resistor
        name="R4"
        resistance="1.5k"
        footprint="0603"
        schX={-0.8}
        schY={6.35}
        schRotation="270deg"
        connections={{
          pin1: sel.net().OUT,
          pin2: sel.net().N_PGOOD_LED_A,
        }}
      />
      <led
        name="D1"
        color="green"
        footprint="0603"
        schX={-0.8}
        schY={4.4}
        schRotation="270deg"
        connections={{
          anode: sel.net().N_PGOOD_LED_A,
          cathode: sel.net().N_PGOOD_LED,
        }}
      />

      <resistor
        name="R5"
        resistance="1.5k"
        footprint="0603"
        schX={0.8}
        schY={6.35}
        schRotation="270deg"
        connections={{
          pin1: sel.net().OUT,
          pin2: sel.net().N_CHG_LED_A,
        }}
      />
      <led
        name="D2"
        color="red"
        footprint="0603"
        schX={0.8}
        schY={4.4}
        schRotation="270deg"
        connections={{
          anode: sel.net().N_CHG_LED_A,
          cathode: sel.net().N_CHG_LED,
        }}
      />

      <schematicbox
        schX={6.3}
        schY={-0.15}
        width={2.9}
        height={6.3}
        title="SYSTEM"
        titleInside
        titleAlignment="top_center"
        titleFontSize={0.35}
        strokeStyle="dashed"
      />
      <netlabel net="OUT" schX={4.85} schY={0.8} anchorSide="left" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
