import { expect, test } from "bun:test"
import type { PcbSmtPadRotatedPill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["NC"],
  pin2: ["IN_POS"],
  pin3: ["IN_NEG"],
  pin4: ["GND"],
  pin5: ["VS"],
  pin6: ["REF2"],
  pin7: ["REF1"],
  pin8: ["OUT"],
} as const

test.failing(
  "imported INA240A1PWR should preserve rotated pill pads",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="12mm" height="12mm">
        <chip
          name="U1"
          pinLabels={pinLabels}
          supplierPartNumbers={{
            jlcpcb: ["C93965"],
          }}
          manufacturerPartNumber="INA240A1PWR"
          footprint="dfn8_pillpads_p0.65mm_w7.3082mm_pw0.353mm_pl1.454mm_pin1location(leftside,bottom)"
          cadModel={{
            objUrl:
              "https://modelcdn.tscircuit.com/easyeda_models/assets/C93965.obj?uuid=2d0fd2703afb4f81a9dfc54e2181a624",
            stepUrl:
              "https://modelcdn.tscircuit.com/easyeda_models/assets/C93965.step?uuid=2d0fd2703afb4f81a9dfc54e2181a624",
            pcbRotationOffset: 0,
            modelOriginPosition: { x: 0, y: 0, z: 0 },
          }}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const pads = circuit.db.pcb_smtpad.list()
    const rotatedPillPads = pads.filter(
      (pad): pad is PcbSmtPadRotatedPill => pad.shape === "rotated_pill",
    )

    expect(pads).toHaveLength(8)
    expect(rotatedPillPads.map((pad) => pad.ccw_rotation)).toEqual(
      Array(8).fill(90),
    )
    expect(rotatedPillPads.map((pad) => pad.port_hints?.[0])).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ])
  },
)
