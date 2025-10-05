import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("pcb autolayout out of board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25.4mm" height="25.4mm">
      <group>
        <chip name="U1" footprint="soic20_pw0.6_pl3.9_w11.9_p1.25" />
        <capacitor
          name="C1"
          capacitance="0.1uF"
          footprint="0603"
          schX={-2}
          schY={0}
          schRotation={-90}
          connections={{
            pin2: [sel.U1.pin20, sel.net.GND],
            pin1: [sel.U1.pin19, sel.net.V3_3],
          }}
        />
        <capacitor
          name="C2"
          capacitance="4.7uF"
          footprint="0603"
          connections={{ pin2: sel.U1.pin20, pin1: sel.net.V3_3 }}
          schRotation={-90}
          pcbRotation={180}
        />
        <resistor
          name="R1"
          resistance="2.2k"
          footprint="0603"
          schRotation={90}
          connections={{ pin1: sel.U1.pin9, pin2: sel.JP1.pin3 }}
        />
        <resistor
          name="R2"
          resistance="2.2k"
          footprint="0603"
          schRotation={90}
          connections={{ pin1: sel.U1.pin10, pin2: sel.JP1.pin1 }}
        />
        <resistor
          name="R3"
          resistance="4.7k"
          footprint="0603"
          schRotation={90}
          connections={{ pin1: sel.D1.pin1, pin2: sel.JP2.pin1 }}
        />
        <led
          name="D1"
          color="RED"
          footprint="0603"
          schRotation={-90}
          connections={{ pin2: sel.net.GND }}
        />
        <solderjumper
          name="JP1"
          footprint="solderjumper3_bridged123_pw0.66_pl1.270_p1"
          layer="bottom"
          bridgedPins={[["1", "2", "3"]]}
          pcbRotation={90}
          schRotation={180}
        />
        <solderjumper
          name="JP2"
          footprint="solderjumper2_bridged12_pw0.66_pl1.270_p1"
          layer="bottom"
          bridgedPins={[["1", "2"]]}
          pcbRotation={90}
          schRotation={180}
          connections={{ pin2: sel.net.V3_3 }}
        />
        <jumper
          name="JP3"
          footprint="pinrow4_id1.016_od1.88_nosquareplating_pinlabeltextalignright_pinlabelorthogonal_doublesidedpinlabel_pinlabelverticallyinverted"
          connections={{ pin3: sel.U1.pin10 }}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // TODO uncomment when fixed
  //expect(circuit.db.pcb_component_outside_board_error.list()).toEqual([])

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
