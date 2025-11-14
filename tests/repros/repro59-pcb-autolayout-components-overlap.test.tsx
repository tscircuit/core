import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("pcb autolayout components overlap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group>
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
      </group>
      <jumper
        pcbX={0}
        pcbY={0}
        name="JP3"
        footprint="pinrow4_id1.016_od1.88_nosquareplating_pinlabeltextalignright_pinlabelorthogonal_doublesidedpinlabel_pinlabelverticallyinverted"
        connections={{ pin3: sel.U1.pin10 }}
        pinLabels={{ pin1: "GND", pin2: "POWER", pin3: "DATA", pin4: "CLK" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // TODO uncomment when fixed
  //expect(circuit.db.pcb_component_outside_board_error.list()).toEqual([])

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
