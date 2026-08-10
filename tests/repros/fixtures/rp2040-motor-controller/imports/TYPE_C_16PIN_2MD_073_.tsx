import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["EH1"],
  pin2: ["EH2"],
  pin3: ["EH3"],
  pin4: ["EH4"],
  pin5: ["A1B12"],
  pin6: ["A4B9"],
  pin7: ["B8"],
  pin8: ["A5"],
  pin9: ["B7"],
  pin10: ["A6"],
  pin11: ["A7"],
  pin12: ["B6"],
  pin13: ["A8"],
  pin14: ["B5"],
  pin15: ["B4A9"],
  pin16: ["B1A12"],
} as const

export const TYPE_C_16PIN_2MD_073_ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      pinLabels={pinLabels}
      standard="usb_c"
      supplierPartNumbers={{
        jlcpcb: ["C2765186"],
      }}
      manufacturerPartNumber="TYPE_C_16PIN_2MD_073_"
      footprint="usbcmidmount"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2765186.obj?uuid=4ee8413127e64716b804db03d4b340ae",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2765186.step?uuid=4ee8413127e64716b804db03d4b340ae",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.000012699999956566899,
          y: 1.5749970500000927,
          z: -1.6800018,
        },
      }}
      {...props}
    />
  )
}
