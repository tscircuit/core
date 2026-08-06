import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const logicTrace = { thickness: "0.2mm", routingPhaseIndex: 4 } as const

const pinLabels = {
  pin1: ["CPL"],
  pin2: ["CPH"],
  pin3: ["VCP"],
  pin4: ["VM"],
  pin5: ["VDRAIN"],
  pin6: ["GHA"],
  pin7: ["SHA"],
  pin8: ["GLA"],
  pin9: ["SPA"],
  pin10: ["SNA"],
  pin11: ["SNB"],
  pin12: ["SPB"],
  pin13: ["GLB"],
  pin14: ["SHB"],
  pin15: ["GHB"],
  pin16: ["GHC"],
  pin17: ["SHC"],
  pin18: ["GLC"],
  pin19: ["SPC"],
  pin20: ["SNC"],
  pin21: ["SOC"],
  pin22: ["SOB"],
  pin23: ["SOA"],
  pin24: ["VREF"],
  pin25: ["nFAULT"],
  pin26: ["MODE"],
  pin27: ["IDRIVE"],
  pin28: ["VDS"],
  pin29: ["GAIN"],
  pin30: ["ENABLE"],
  pin31: ["CAL"],
  pin32: ["AGND"],
  pin33: ["DVDD"],
  pin34: ["INHA"],
  pin35: ["INLA"],
  pin36: ["INHB"],
  pin37: ["INLB"],
  pin38: ["INHC"],
  pin39: ["INLC"],
  pin40: ["PGND"],
  pin41: ["EP", "thermalpad"],
} as const

const DRV8323HRTAR = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    supplierPartNumbers={{ jlcpcb: ["C701783"] }}
    manufacturerPartNumber="DRV8323HRTAR"
    footprint="qfn40_thermalpad4.5mmx4.5mm_p0.4999mm_h6.8mm_pl0.7mm_pin1location(bottomside,left)"
    {...props}
  />
)

test("repro171: DRV8323 upper-pin connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="24mm" routingDisabled>
      <net name="GND" isGroundNet />
      <net name="VM" isPowerNet />

      <DRV8323HRTAR
        name="U_GATE"
        showPinAliases
        pcbX={32}
        pcbY={2}
        schX={-8}
        schY={0}
        schWidth={5.2}
        schHeight={5.8}
        schPinArrangement={{
          leftSide: {
            pins: [34, 35, 36, 37, 38, 39, 30, 31, 25],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [6, 7, 8, 15, 14, 13, 16, 17, 18],
            direction: "top-to-bottom",
          },
          topSide: {
            pins: [4, 5, 3, 2, 1, 33, 26, 29, 27, 28],
            direction: "left-to-right",
          },
          bottomSide: {
            pins: [40, 41, 32, 9, 10, 12, 11, 19, 20, 23, 22, 21, 24],
            direction: "left-to-right",
          },
        }}
      />

      <capacitor
        name="C_GATE_VM"
        capacitance="1uF"
        footprint="1206"
        pcbX={42}
        pcbY={-1}
        pcbRotation={90}
        schRotation={270}
        schX={-12}
        schY={6.5}
      />
      <capacitor
        name="C_DVDD"
        capacitance="1uF"
        footprint="0603"
        pcbX={26}
        pcbY={3.5}
        schRotation={270}
        schX={-10}
        schY={-6.5}
      />
      <capacitor
        name="C_CP"
        capacitance="47nF"
        footprint="0603"
        pcbX={26.5}
        pcbY={1}
        schOrientation="vertical"
        schX={-8}
        schY={6.5}
      />
      <capacitor
        name="C_VCP"
        capacitance="1uF"
        footprint="1206"
        pcbX={22}
        pcbY={-2}
        pcbRotation={90}
        schOrientation="vertical"
        schX={-4}
        schY={6.5}
      />
      <resistor
        name="R_GAIN"
        resistance="47k"
        footprint="0603"
        pcbX={28.5}
        pcbY={7.5}
        pcbRotation={90}
        schRotation={270}
        schX={-8}
        schY={-8.5}
      />
      <resistor
        name="R_IDRIVE"
        resistance="75k"
        footprint="0603"
        pcbX={31.5}
        pcbY={7.5}
        pcbRotation={90}
        schRotation={270}
        schX={-5}
        schY={-8.5}
      />
      <resistor
        name="R_VDS"
        resistance="0"
        footprint="0603"
        pcbX={34.5}
        pcbY={7.5}
        pcbRotation={90}
        schRotation={270}
        schX={-2}
        schY={-8.5}
      />
      <trace from=".U_GATE > .VM" to="net.VM" {...logicTrace} />
      <trace from=".U_GATE > .VDRAIN" to="net.VM" {...logicTrace} />
      <trace from=".C_GATE_VM > .pin1" to=".U_GATE > .VM" {...logicTrace} />
      <trace from=".C_GATE_VM > .pin2" to="net.GND" {...logicTrace} />
      <trace from=".C_CP > .pin1" to=".U_GATE > .CPH" {...logicTrace} />
      <trace from=".C_CP > .pin2" to=".U_GATE > .CPL" {...logicTrace} />
      <trace from=".C_VCP > .pin1" to=".U_GATE > .VCP" {...logicTrace} />
      <trace from=".C_VCP > .pin2" to="net.VM" {...logicTrace} />
      <trace from=".C_DVDD > .pin1" to=".U_GATE > .DVDD" {...logicTrace} />
      <trace from=".C_DVDD > .pin2" to="net.GND" {...logicTrace} />
      <trace from=".U_GATE > .MODE" to="net.GND" {...logicTrace} />
      <trace from=".U_GATE > .GAIN" to=".R_GAIN > .pin1" {...logicTrace} />
      <trace from=".R_GAIN > .pin2" to="net.GND" {...logicTrace} />
      <trace from=".U_GATE > .IDRIVE" to=".R_IDRIVE > .pin1" {...logicTrace} />
      <trace from=".R_IDRIVE > .pin2" to="net.GND" {...logicTrace} />
      <trace from=".U_GATE > .VDS" to=".R_VDS > .pin1" {...logicTrace} />
      <trace from=".R_VDS > .pin2" to="net.GND" {...logicTrace} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
