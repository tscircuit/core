import { ReferenceLabel } from "../product/reference-label"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
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
  pin13: ["pin13"],
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
  pin25: ["pin25"],
  pin26: ["pin26"]
} as const

export const AFC01_S24FCA_00 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      pinLabels={pinLabels}
      pinAttributes={{pin1: {doNotConnect: true}, pin4: {doNotConnect: true}, pin6: {doNotConnect: true}, pin7: {doNotConnect: true}, pin19: {doNotConnect: true}}}
      supplierPartNumbers={{
  "jlcpcb": [
    "C262669"
  ]
}}
      manufacturerPartNumber="AFC01-S24FCA-00"
      footprint={<footprint insertionDirection="from_bottom">
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin25"]} pcbX="7.44982mm" pcbY="-1.25011815mm" width="1.999996mm" height="1.5999968mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin26"]} pcbX="-7.44982mm" pcbY="-1.25011815mm" width="1.999996mm" height="1.5999968mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin24"]} pcbX="5.750052mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin23"]} pcbX="5.25018mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin22"]} pcbX="4.750054mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin21"]} pcbX="4.250182mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin20"]} pcbX="3.750056mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin19"]} pcbX="3.250184mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin18"]} pcbX="2.750058mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin17"]} pcbX="2.250186mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin16"]} pcbX="1.75006mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin15"]} pcbX="1.250188mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin14"]} pcbX="0.750062mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin13"]} pcbX="0.25019mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin12"]} pcbX="-0.249936mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin11"]} pcbX="-0.749808mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin10"]} pcbX="-1.249934mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin9"]} pcbX="-1.749806mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin8"]} pcbX="-2.249932mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin7"]} pcbX="-2.749804mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin6"]} pcbX="-3.24993mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin5"]} pcbX="-3.749802mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin4"]} pcbX="-4.249928mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin3"]} pcbX="-4.7498mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="-5.249926mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-5.749798mm" pcbY="1.40011785mm" width="0.2999994mm" height="1.2999974mm" shape="rect" />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-8.26389000000006,"y":-2.280088149999983},{"x":-8.26389000000006,"y":-4.370508149999864},{"x":8.256269999999972,"y":-4.370508149999864},{"x":8.256269999999972,"y":-4.243508149999911}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":8.250046999999881,"y":-4.275080349999826},{"x":8.263000999999917,"y":-2.2813327499998195}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":8.263000999999917,"y":-0.21900514999981624},{"x":8.263000999999917,"y":1.1629834500000698},{"x":6.131102800000008,"y":1.1629834500000698}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-6.131026599999927,"y":1.1630088500000966},{"x":-8.26287400000001,"y":1.1630088500000966},{"x":-8.26287400000001,"y":-0.21892894999996315}]} />
<silkscreencircle strokeWidth="0.15mm" pcbX="-6.549898mm" pcbY="1.77502185mm" radius="0.199898mm" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-8.69981800000005,"y":2.300116550000098},{"x":8.69981800000005,"y":2.300116550000098},{"x":8.69981800000005,"y":-4.557033550000028},{"x":-8.69981800000005,"y":-4.557033550000028},{"x":-8.69981800000005,"y":2.300116550000098}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C262669.obj?uuid=f4bf300ddc81445bb004d4c904d70ad0",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C262669.step?uuid=f4bf300ddc81445bb004d4c904d70ad0",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.0000762000000804619, y: 1.6320396499999106, z: -0.03 },
      }}
      {...props}
    />
  )
}