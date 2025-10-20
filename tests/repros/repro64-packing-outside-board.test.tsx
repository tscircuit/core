import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("pcb packing outside board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={24.13} height={15.24}>
      <jumper
        pcbX={10}
        pcbRotation={-90}
        name="JP1"
        pinLabels={{ pin1: ["IP_POS"] }}
        footprint="pinrow3_id1.016_od1.88_nosquareplating"
      />
      <jumper
        pcbX={-8.255}
        pcbY={3.81}
        name="JP2"
        pinLabels={{ pin1: ["IP_POS"] }}
        footprint="pinrow1_id3.81_od6.198_nosquareplating_pinlabeltextalignleft"
      />
      <jumper
        pcbX={-4.9}
        pcbRotation={90}
        name="JP3"
        pinLabels={{ pin1: ["IP_POS"] }}
        footprint="pinrow2_id1.016_od1.88_nosquareplating"
      />
      <jumper
        pcbX={-8.255}
        pcbY={-3.81}
        name="JP4"
        pinLabels={{ pin1: ["IP_NEG"] }}
        footprint="pinrow1_id3.81_od6.198_nosquareplating_pinlabeltextalignleft"
      />
      <group>
        <chip name="U1" footprint="soic8" pcbRotation={-90} />
        <resistor name="R1" resistance="4.7k" footprint="0603" />
        <capacitor name="C1" capacitance="0.1uF" footprint="cap0603" />
        <capacitor name="C2" capacitance="0.1uF" footprint="cap0603" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // console.log(circuitJson)

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
