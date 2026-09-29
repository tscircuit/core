import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["SDO"],
  pin2: ["SDX"],
  pin3: ["VDDIO"],
  pin4: ["NC2"],
  pin5: ["INT1"],
  pin6: ["INT2"],
  pin7: ["VDD"],
  pin8: ["GNDIO"],
  pin9: ["GND"],
  pin10: ["CSB"],
  pin11: ["NC1"],
  pin12: ["SCX"],
} as const

const pinAttributes = {
  pin4: { doNotConnect: true },
  pin7: { requiresPower: true },
  pin9: { requiresGround: true },
  pin11: { doNotConnect: true },
} as const

const footprinterPinLabels = {
  ...pinLabels,
  pin11: [...pinLabels["pin11"], "pin1"],
  pin12: [...pinLabels["pin12"], "pin2"],
  pin1: [...pinLabels["pin1"], "pin3"],
  pin2: [...pinLabels["pin2"], "pin4"],
  pin3: [...pinLabels["pin3"], "pin5"],
  pin4: [...pinLabels["pin4"], "pin6"],
  pin5: [...pinLabels["pin5"], "pin7"],
  pin6: [...pinLabels["pin6"], "pin8"],
  pin7: [...pinLabels["pin7"], "pin9"],
  pin8: [...pinLabels["pin8"], "pin10"],
  pin9: [...pinLabels["pin9"], "pin11"],
  pin10: [...pinLabels["pin10"], "pin12"],
} as const

export const BMA400 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C437655"],
      }}
      manufacturerPartNumber="BMA400"
      footprint="lga12_grid2x4_w2.25mm_h2.25mm_pl0.5mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C437655.obj?uuid=83ec6157b4954879af30009d604f164f",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C437655.step?uuid=83ec6157b4954879af30009d604f164f",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
