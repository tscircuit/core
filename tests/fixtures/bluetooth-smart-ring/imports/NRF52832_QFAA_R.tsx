import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["DEC1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"],
  pin9: ["pin9"],
  pin10: ["pin10"],
  pin11: ["pin11"],
  pin12: ["pin12"],
  pin13: ["VDD1"],
  pin14: ["pin14"],
  pin15: ["pin15"],
  pin16: ["pin16"],
  pin17: ["pin17"],
  pin18: ["pin18"],
  pin19: ["pin19"],
  pin20: ["pin20"],
  pin21: ["pin21"],
  pin22: ["pin22"],
  pin23: ["pin23"],
  pin24: ["pin24"],
  pin25: ["SWDCLK"],
  pin26: ["SWDIO"],
  pin27: ["pin27"],
  pin28: ["pin28"],
  pin29: ["pin29"],
  pin30: ["ANT"],
  pin31: ["VSS1"],
  pin32: ["DEC2"],
  pin33: ["DEC3"],
  pin34: ["XC1"],
  pin35: ["XC2"],
  pin36: ["VDD2"],
  pin37: ["pin37"],
  pin38: ["pin38"],
  pin39: ["pin39"],
  pin40: ["pin40"],
  pin41: ["pin41"],
  pin42: ["pin42"],
  pin43: ["pin43"],
  pin44: ["NC"],
  pin45: ["VSS2"],
  pin46: ["DEC4"],
  pin47: ["DCC"],
  pin48: ["VDD3"],
  pin49: ["EP"],
} as const

const pinAttributes = {
  pin13: { requiresPower: true },
  pin31: { requiresGround: true },
  pin36: { requiresPower: true },
  pin44: { doNotConnect: true },
  pin45: { requiresGround: true },
  pin48: { requiresPower: true },
} as const

const footprinterPinLabels = {
  ...pinLabels,
  pin49: [...pinLabels["pin49"], "thermalpad"],
} as const

export const NRF52832_QFAA_R = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C77540"],
      }}
      manufacturerPartNumber="NRF52832-QFAA-R"
      footprint="qfn48_thermalpad3.8mmx3.8mm_p0.4mm_h6.68mm_pw0.2mm_pl0.66mm_pin1location(bottomside,left)"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C77540.obj?uuid=bdd2e424ca814172a2a3360611c5d9d7",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C77540.step?uuid=bdd2e424ca814172a2a3360611c5d9d7",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
