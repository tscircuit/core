import { ReferenceLabel } from "../product/reference-label"
import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode","neg"],
  pin2: ["anode","pos"]
} as const

export const MBR0530T1G = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C82046"
  ]
}}
      manufacturerPartNumber="MBR0530T1G"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2","anode","pos"]} pcbX="1.700022mm" pcbY="0mm" width="1.1999976mm" height="0.9500108mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1","cathode","neg"]} pcbX="-1.700022mm" pcbY="0mm" width="1.1999976mm" height="0.9500108mm" shape="rect" />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":1.3462000000000103,"y":-0.7061453999999969},{"x":1.3462000000000103,"y":-0.850010999999995}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":1.3462000000000103,"y":0.8500110000000092},{"x":1.3462000000000103,"y":0.7061454000000111}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-1.346199999999996,"y":-0.850010999999995},{"x":-1.6379698000000076,"y":-0.850010999999995},{"x":-1.6389857999999862,"y":-0.848994999999988}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-1.346199999999996,"y":0.8500110000000092},{"x":-1.6429735999999764,"y":0.8500110000000092},{"x":-1.6439895999999976,"y":0.8489950000000022}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-1.346199999999996,"y":0.8500110000000092},{"x":1.3462000000000103,"y":0.8500110000000092}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":0.406400000000005,"y":0.406400000000005},{"x":0.406400000000005,"y":-0.40639999999999077}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":0.406400000000005,"y":0.0002539999999982001},{"x":0.720089999999999,"y":0.0002539999999982001}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.28000959999999964,"y":0},{"x":-0.610006399999989,"y":0}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.2540000000000049,"y":0.5080000000000098},{"x":-0.2540000000000049,"y":-0.5079999999999956}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.17779999999999063,"y":0},{"x":0.406400000000005,"y":0.406400000000005}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":0.406400000000005,"y":-0.40639999999999077},{"x":-0.17779999999999063,"y":0}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":1.3462000000000103,"y":-0.850010999999995},{"x":-1.346199999999996,"y":-0.850010999999995}]} />
<ReferenceLabel name={props.name} />
<fabricationnotepath route={[{"x":1.1899391999999978,"y":0.21201379999999403},{"x":2.031898400000003,"y":0.21201379999999403},{"x":2.031898400000003,"y":0.005054600000008236},{"x":1.1893295999999935,"y":0.005054600000008236},{"x":1.1899391999999978,"y":0.21201379999999403}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":1.5246096000000051,"y":-0.33840419999998517},{"x":1.5246096000000051,"y":0.5035550000000057},{"x":1.7315688000000051,"y":0.5035550000000057},{"x":1.7315688000000051,"y":-0.3390137999999894},{"x":1.5246096000000051,"y":-0.33840419999998517}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-2.041524999999993,"y":0.12377420000001393},{"x":-1.1995657999999878,"y":0.12377420000001393},{"x":-1.1995657999999878,"y":-0.08318499999998608},{"x":-2.042134599999997,"y":-0.08318499999998608},{"x":-2.041524999999993,"y":0.12377420000001393}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-0.3999991999999821,"y":0},{"x":-0.3999991999999821,"y":0},{"x":0.19999959999999817,"y":-0.5999987999999945},{"x":0.19999959999999817,"y":0.5999988000000087},{"x":-0.3999991999999821,"y":0}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-2.5500207999999844,"y":1.0999856000000108},{"x":2.5500207999999986,"y":1.0999856000000108},{"x":2.5500207999999986,"y":-1.100010999999995},{"x":-2.5500207999999844,"y":-1.100010999999995},{"x":-2.5500207999999844,"y":1.0999856000000108}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C82046.obj?uuid=e9d505c99b6c436aaf827a29c5ba4f84",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C82046.step?uuid=e9d505c99b6c436aaf827a29c5ba4f84",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999999199463, z: -0.6 },
      }}
      {...restProps}
    />
  )
}