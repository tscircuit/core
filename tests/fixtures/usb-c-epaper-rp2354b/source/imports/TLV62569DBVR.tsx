import { ReferenceLabel } from "../product/reference-label"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["EN"],
  pin2: ["GND"],
  pin3: ["SW"],
  pin4: ["VIN"],
  pin5: ["FB"]
} as const

const pinAttributes = {
  pin2: {capabilities: [], requiresGround: true, requiresVoltage: 0, mustBeConnected: true},
  pin4: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true},
  pin5: {isInput: true, capabilities: [], mustBeConnected: true},
  pin3: {isOutput: true, capabilities: [], providesPower: true},
  pin1: {isInput: true, capabilities: [], mustBeConnected: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const TLV62569DBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C141836"
  ]
}}
      manufacturerPartNumber="TLV62569DBVR"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin5"]} pcbX="-1.300099mm" pcbY="-0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin4"]} pcbX="-1.300099mm" pcbY="0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin3"]} pcbX="1.300099mm" pcbY="0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="1.300099mm" pcbY="-0mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="1.300099mm" pcbY="-0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<silkscreenpath route={[{"x":0.8999728000000005,"y":-1.404111999999941},{"x":0.8999728000000005,"y":-1.5500604000000067}]} />
<silkscreenpath route={[{"x":0.8999728000000005,"y":-0.45412660000010874},{"x":0.8999728000000005,"y":-0.4958079999998972}]} />
<silkscreenpath route={[{"x":0.8999728000000005,"y":0.4958079999998972},{"x":0.8999728000000005,"y":0.45415200000002187}]} />
<silkscreenpath route={[{"x":0.8999728000000005,"y":1.5499587999998994},{"x":0.8999728000000005,"y":1.404111999999941}]} />
<silkscreenpath route={[{"x":-0.9000489999999672,"y":-1.404111999999941},{"x":-0.9000489999999672,"y":-1.5500604000000067}]} />
<silkscreenpath route={[{"x":-0.9000489999999672,"y":0.4958079999998972},{"x":-0.9000489999999672,"y":-0.4958334000000377}]} />
<silkscreenpath route={[{"x":-0.9000489999999672,"y":1.5499587999998994},{"x":-0.9000489999999672,"y":1.4040866000000278}]} />
<silkscreenpath route={[{"x":-0.9000489999999672,"y":1.5499587999998994},{"x":0.8999728000000005,"y":1.5499587999998994}]} />
<silkscreenpath route={[{"x":-0.9000489999999672,"y":-1.5500604000000067},{"x":0.8999728000000005,"y":-1.5500604000000067}]} />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-2.1000978999999234,"y":1.6999843999999484},{"x":2.1000978999999234,"y":1.6999843999999484},{"x":2.1000978999999234,"y":-1.7000097999999753},{"x":-2.1000978999999234,"y":-1.7000097999999753},{"x":-2.1000978999999234,"y":1.6999843999999484}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C141836.obj?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C141836.step?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.049083 },
      }}
      {...props}
    />
  )
}