import { ReferenceLabel } from "../product/reference-label"
import type { TransistorProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["gate", "G"],
  pin2: ["source", "S"],
  pin3: ["drain", "D"]
} as const

export const SI1308EDL_T1_GE3 = (props: Omit<TransistorProps, "type">) => {
  return (
    <transistor type="mosfet"
      pinLabels={pinLabels}
      pinAttributes={{pin1: {isInput: true}, pin2: {isPassive: true}, pin3: {isPassive: true}}}
      symbol={
        <symbol>
          <schematicpath points={[{"x":-0.2,"y":0},{"x":-0.08,"y":-0.04},{"x":-0.08,"y":0.04},{"x":-0.2,"y":0}]} strokeColor="#880000" isFilled fillColor="#FEFEFE" />
          <schematicpath points={[{"x":0.2,"y":0.04},{"x":0.14,"y":-0.06},{"x":0.26,"y":-0.06},{"x":0.2,"y":0.04}]} strokeColor="#880000" isFilled fillColor="#FEFEFE" />
          <schematicpath points={[{"x":-0.2,"y":0.14},{"x":0,"y":0.14},{"x":0,"y":0.2},{"x":0.2,"y":0.2},{"x":0.2,"y":0.04}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.2,"y":0},{"x":0,"y":0},{"x":0,"y":-0.2},{"x":0.2,"y":-0.2},{"x":0.2,"y":-0.06}]} strokeColor="#880000" />
          <schematicpath points={[{"x":0,"y":-0.14},{"x":-0.2,"y":-0.14}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.24,"y":0.18},{"x":-0.24,"y":-0.18}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.2,"y":0.18},{"x":-0.2,"y":0.1}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.2,"y":-0.04},{"x":-0.2,"y":0.04}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.2,"y":-0.18},{"x":-0.2,"y":-0.1}]} strokeColor="#880000" />
          <schematicpath points={[{"x":0.28,"y":0.04},{"x":0.24,"y":0.04},{"x":0.16,"y":0.04},{"x":0.12,"y":0.04}]} strokeColor="#880000" />
          <port name="pin3" pinNumber={3} aliases={["D"]} direction="up" schX={0} schY={0.4} schStemLength={0.2} />
          <port name="pin1" pinNumber={1} aliases={["G"]} direction="left" schX={-0.6} schY={0} schStemLength={0.2} />
          <port name="pin2" pinNumber={2} aliases={["S"]} direction="down" schX={0} schY={-0.6} schStemLength={0.2} />
          <schematicpath points={[{"x":-0.24,"y":0},{"x":-0.4,"y":0},{"x":-0.4,"y":-0.4},{"x":0,"y":-0.4},{"x":0,"y":-0.2}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.32,"y":-0.06},{"x":-0.36,"y":-0.08},{"x":-0.44,"y":-0.08},{"x":-0.48,"y":-0.1}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.4,"y":-0.08},{"x":-0.46,"y":-0.18},{"x":-0.34,"y":-0.18},{"x":-0.4,"y":-0.08}]} strokeColor="#880000" isFilled fillColor="#FEFEFE" />
          <schematicpath points={[{"x":-0.48,"y":-0.36},{"x":-0.44,"y":-0.34},{"x":-0.36,"y":-0.34},{"x":-0.32,"y":-0.32}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.4,"y":-0.34},{"x":-0.34,"y":-0.24},{"x":-0.46,"y":-0.24},{"x":-0.4,"y":-0.34}]} strokeColor="#880000" isFilled fillColor="#FEFEFE" />
          <schematictext schX={-0.17} schY={0.62} text="{NAME}" fontSize={0.2} anchor="bottom_center" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C469327"
  ]
}}
      manufacturerPartNumber="SI1308EDL-T1-GE3"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin3"]} pcbX="-0.8001mm" pcbY="-0mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="0.8001mm" pcbY="0.649986mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="0.8001mm" pcbY="-0.649986mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.6999986000000007,"y":-1.099997799999997},{"x":-0.6999986000000007,"y":-0.6311392000000069}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.6999986000000007,"y":1.0999977999999828},{"x":0.09999979999999198,"y":1.0999977999999828}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.6999986000000007,"y":-1.099997799999997},{"x":0.09999979999999198,"y":-1.099997799999997}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.6999986000000007,"y":0.6311391999999927},{"x":-0.6999986000000007,"y":1.0999977999999828}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":0.7999984000000069,"y":-1.2999974000000236},{"x":0.676810019950679,"y":-1.4250859285046573},{"x":0.8012683999999979,"y":-1.548910920239507},{"x":0.9257267800493167,"y":-1.4250859285046573},{"x":0.8025384000000031,"y":-1.2999974000000236}]} />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-1.5000991,"y":1.2999851999999947},{"x":1.5000991,"y":1.2999851999999947},{"x":1.5000991,"y":-1.299985200000009},{"x":-1.5000991,"y":-1.299985200000009},{"x":-1.5000991,"y":1.2999851999999947}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C469327.obj?uuid=3848bf4e9fa24fe392fb1bdb7e03bbce",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C469327.step?uuid=3848bf4e9fa24fe392fb1bdb7e03bbce",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0.000012699999999199463, z: -0.075 },
      }}
      {...props}
    />
  )
}
