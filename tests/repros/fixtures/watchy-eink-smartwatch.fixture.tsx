import type { ChipProps } from "@tscircuit/props"

import { Fragment } from "react"

const WATCHY_BOARD_BOUNDS = {
  width: 33.8,
  height: 45.96,
  thickness: 1.4,
} as const

const BOARD_OUTLINE = [
  {
    x: 16.9,
    y: 18.98,
  },
  {
    x: 16.8508,
    y: 19.6057,
  },
  {
    x: 16.7042,
    y: 20.2161,
  },
  {
    x: 16.464,
    y: 20.796,
  },
  {
    x: 16.1361,
    y: 21.3311,
  },
  {
    x: 15.7284,
    y: 21.8084,
  },
  {
    x: 15.2511,
    y: 22.2161,
  },
  {
    x: 14.716,
    y: 22.544,
  },
  {
    x: 14.1361,
    y: 22.7842,
  },
  {
    x: 13.5257,
    y: 22.9308,
  },
  {
    x: 12.9,
    y: 22.98,
  },
  {
    x: -12.9,
    y: 22.98,
  },
  {
    x: -13.5257,
    y: 22.9308,
  },
  {
    x: -14.1361,
    y: 22.7842,
  },
  {
    x: -14.716,
    y: 22.544,
  },
  {
    x: -15.2511,
    y: 22.2161,
  },
  {
    x: -15.7284,
    y: 21.8084,
  },
  {
    x: -16.1361,
    y: 21.3311,
  },
  {
    x: -16.464,
    y: 20.796,
  },
  {
    x: -16.7042,
    y: 20.2161,
  },
  {
    x: -16.8508,
    y: 19.6057,
  },
  {
    x: -16.9,
    y: 18.98,
  },
  {
    x: -16.9,
    y: -18.98,
  },
  {
    x: -16.8508,
    y: -19.6057,
  },
  {
    x: -16.7042,
    y: -20.2161,
  },
  {
    x: -16.464,
    y: -20.796,
  },
  {
    x: -16.1361,
    y: -21.3311,
  },
  {
    x: -15.7284,
    y: -21.8084,
  },
  {
    x: -15.2511,
    y: -22.2161,
  },
  {
    x: -14.716,
    y: -22.544,
  },
  {
    x: -14.1361,
    y: -22.7842,
  },
  {
    x: -13.5257,
    y: -22.9308,
  },
  {
    x: -12.9,
    y: -22.98,
  },
  {
    x: 12.9,
    y: -22.98,
  },
  {
    x: 13.5257,
    y: -22.9308,
  },
  {
    x: 14.1361,
    y: -22.7842,
  },
  {
    x: 14.716,
    y: -22.544,
  },
  {
    x: 15.2511,
    y: -22.2161,
  },
  {
    x: 15.7284,
    y: -21.8084,
  },
  {
    x: 16.1361,
    y: -21.3311,
  },
  {
    x: 16.464,
    y: -20.796,
  },
  {
    x: 16.7042,
    y: -20.2161,
  },
  {
    x: 16.8508,
    y: -19.6057,
  },
  {
    x: 16.9,
    y: -18.98,
  },
]

const TOP_STRAP_CUTOUT = [
  {
    x: 13,
    y: 18.98,
  },
  {
    x: -13,
    y: 18.98,
  },
  {
    x: -13.098,
    y: 18.9848,
  },
  {
    x: -13.1951,
    y: 18.9992,
  },
  {
    x: -13.2903,
    y: 19.0231,
  },
  {
    x: -13.3827,
    y: 19.0561,
  },
  {
    x: -13.4714,
    y: 19.0981,
  },
  {
    x: -13.5556,
    y: 19.1485,
  },
  {
    x: -13.6344,
    y: 19.207,
  },
  {
    x: -13.7071,
    y: 19.2729,
  },
  {
    x: -13.773,
    y: 19.3456,
  },
  {
    x: -13.8315,
    y: 19.4244,
  },
  {
    x: -13.8819,
    y: 19.5086,
  },
  {
    x: -13.9239,
    y: 19.5973,
  },
  {
    x: -13.9569,
    y: 19.6897,
  },
  {
    x: -13.9808,
    y: 19.7849,
  },
  {
    x: -13.9952,
    y: 19.882,
  },
  {
    x: -14,
    y: 19.98,
  },
  {
    x: -13.9952,
    y: 20.078,
  },
  {
    x: -13.9808,
    y: 20.1751,
  },
  {
    x: -13.9569,
    y: 20.2703,
  },
  {
    x: -13.9239,
    y: 20.3627,
  },
  {
    x: -13.8819,
    y: 20.4514,
  },
  {
    x: -13.8315,
    y: 20.5356,
  },
  {
    x: -13.773,
    y: 20.6144,
  },
  {
    x: -13.7071,
    y: 20.6871,
  },
  {
    x: -13.6344,
    y: 20.753,
  },
  {
    x: -13.5556,
    y: 20.8115,
  },
  {
    x: -13.4714,
    y: 20.8619,
  },
  {
    x: -13.3827,
    y: 20.9039,
  },
  {
    x: -13.2903,
    y: 20.9369,
  },
  {
    x: -13.1951,
    y: 20.9608,
  },
  {
    x: -13.098,
    y: 20.9752,
  },
  {
    x: -13,
    y: 20.98,
  },
  {
    x: 13,
    y: 20.98,
  },
  {
    x: 13.098,
    y: 20.9752,
  },
  {
    x: 13.1951,
    y: 20.9608,
  },
  {
    x: 13.2903,
    y: 20.9369,
  },
  {
    x: 13.3827,
    y: 20.9039,
  },
  {
    x: 13.4714,
    y: 20.8619,
  },
  {
    x: 13.5556,
    y: 20.8115,
  },
  {
    x: 13.6344,
    y: 20.753,
  },
  {
    x: 13.7071,
    y: 20.6871,
  },
  {
    x: 13.773,
    y: 20.6144,
  },
  {
    x: 13.8315,
    y: 20.5356,
  },
  {
    x: 13.8819,
    y: 20.4514,
  },
  {
    x: 13.9239,
    y: 20.3627,
  },
  {
    x: 13.9569,
    y: 20.2703,
  },
  {
    x: 13.9808,
    y: 20.1751,
  },
  {
    x: 13.9952,
    y: 20.078,
  },
  {
    x: 14,
    y: 19.98,
  },
  {
    x: 13.9952,
    y: 19.882,
  },
  {
    x: 13.9808,
    y: 19.7849,
  },
  {
    x: 13.9569,
    y: 19.6897,
  },
  {
    x: 13.9239,
    y: 19.5973,
  },
  {
    x: 13.8819,
    y: 19.5086,
  },
  {
    x: 13.8315,
    y: 19.4244,
  },
  {
    x: 13.773,
    y: 19.3456,
  },
  {
    x: 13.7071,
    y: 19.2729,
  },
  {
    x: 13.6344,
    y: 19.207,
  },
  {
    x: 13.5556,
    y: 19.1485,
  },
  {
    x: 13.4714,
    y: 19.0981,
  },
  {
    x: 13.3827,
    y: 19.0561,
  },
  {
    x: 13.2903,
    y: 19.0231,
  },
  {
    x: 13.1951,
    y: 18.9992,
  },
  {
    x: 13.098,
    y: 18.9848,
  },
  {
    x: 13,
    y: 18.98,
  },
]

const BOTTOM_STRAP_CUTOUT = [
  {
    x: 13,
    y: -18.98,
  },
  {
    x: 9.95,
    y: -18.98,
  },
  {
    x: 9.901,
    y: -18.9776,
  },
  {
    x: 9.8525,
    y: -18.9704,
  },
  {
    x: 9.8049,
    y: -18.9585,
  },
  {
    x: 9.7587,
    y: -18.9419,
  },
  {
    x: 9.7143,
    y: -18.921,
  },
  {
    x: 9.6722,
    y: -18.8957,
  },
  {
    x: 9.6328,
    y: -18.8665,
  },
  {
    x: 9.5964,
    y: -18.8336,
  },
  {
    x: 9.5635,
    y: -18.7972,
  },
  {
    x: 9.5343,
    y: -18.7578,
  },
  {
    x: 9.509,
    y: -18.7157,
  },
  {
    x: 9.4881,
    y: -18.6713,
  },
  {
    x: 9.4715,
    y: -18.6251,
  },
  {
    x: 9.4596,
    y: -18.5775,
  },
  {
    x: 9.4524,
    y: -18.529,
  },
  {
    x: 9.45,
    y: -18.48,
  },
  {
    x: -8.55,
    y: -18.48,
  },
  {
    x: -8.5524,
    y: -18.529,
  },
  {
    x: -8.5596,
    y: -18.5775,
  },
  {
    x: -8.5715,
    y: -18.6251,
  },
  {
    x: -8.5881,
    y: -18.6713,
  },
  {
    x: -8.609,
    y: -18.7157,
  },
  {
    x: -8.6343,
    y: -18.7578,
  },
  {
    x: -8.6635,
    y: -18.7972,
  },
  {
    x: -8.6964,
    y: -18.8336,
  },
  {
    x: -8.7328,
    y: -18.8665,
  },
  {
    x: -8.7722,
    y: -18.8957,
  },
  {
    x: -8.8143,
    y: -18.921,
  },
  {
    x: -8.8587,
    y: -18.9419,
  },
  {
    x: -8.9049,
    y: -18.9585,
  },
  {
    x: -8.9525,
    y: -18.9704,
  },
  {
    x: -9.001,
    y: -18.9776,
  },
  {
    x: -9.05,
    y: -18.98,
  },
  {
    x: -13,
    y: -18.98,
  },
  {
    x: -13.098,
    y: -18.9848,
  },
  {
    x: -13.1951,
    y: -18.9992,
  },
  {
    x: -13.2903,
    y: -19.0231,
  },
  {
    x: -13.3827,
    y: -19.0561,
  },
  {
    x: -13.4714,
    y: -19.0981,
  },
  {
    x: -13.5556,
    y: -19.1485,
  },
  {
    x: -13.6344,
    y: -19.207,
  },
  {
    x: -13.7071,
    y: -19.2729,
  },
  {
    x: -13.773,
    y: -19.3456,
  },
  {
    x: -13.8315,
    y: -19.4244,
  },
  {
    x: -13.8819,
    y: -19.5086,
  },
  {
    x: -13.9239,
    y: -19.5973,
  },
  {
    x: -13.9569,
    y: -19.6897,
  },
  {
    x: -13.9808,
    y: -19.7849,
  },
  {
    x: -13.9952,
    y: -19.882,
  },
  {
    x: -14,
    y: -19.98,
  },
  {
    x: -13.9952,
    y: -20.078,
  },
  {
    x: -13.9808,
    y: -20.1751,
  },
  {
    x: -13.9569,
    y: -20.2703,
  },
  {
    x: -13.9239,
    y: -20.3627,
  },
  {
    x: -13.8819,
    y: -20.4514,
  },
  {
    x: -13.8315,
    y: -20.5356,
  },
  {
    x: -13.773,
    y: -20.6144,
  },
  {
    x: -13.7071,
    y: -20.6871,
  },
  {
    x: -13.6344,
    y: -20.753,
  },
  {
    x: -13.5556,
    y: -20.8115,
  },
  {
    x: -13.4714,
    y: -20.8619,
  },
  {
    x: -13.3827,
    y: -20.9039,
  },
  {
    x: -13.2903,
    y: -20.9369,
  },
  {
    x: -13.1951,
    y: -20.9608,
  },
  {
    x: -13.098,
    y: -20.9752,
  },
  {
    x: -13,
    y: -20.98,
  },
  {
    x: 13,
    y: -20.98,
  },
  {
    x: 13.098,
    y: -20.9752,
  },
  {
    x: 13.1951,
    y: -20.9608,
  },
  {
    x: 13.2903,
    y: -20.9369,
  },
  {
    x: 13.3827,
    y: -20.9039,
  },
  {
    x: 13.4714,
    y: -20.8619,
  },
  {
    x: 13.5556,
    y: -20.8115,
  },
  {
    x: 13.6344,
    y: -20.753,
  },
  {
    x: 13.7071,
    y: -20.6871,
  },
  {
    x: 13.773,
    y: -20.6144,
  },
  {
    x: 13.8315,
    y: -20.5356,
  },
  {
    x: 13.8819,
    y: -20.4514,
  },
  {
    x: 13.9239,
    y: -20.3627,
  },
  {
    x: 13.9569,
    y: -20.2703,
  },
  {
    x: 13.9808,
    y: -20.1751,
  },
  {
    x: 13.9952,
    y: -20.078,
  },
  {
    x: 14,
    y: -19.98,
  },
  {
    x: 13.9952,
    y: -19.882,
  },
  {
    x: 13.9808,
    y: -19.7849,
  },
  {
    x: 13.9569,
    y: -19.6897,
  },
  {
    x: 13.9239,
    y: -19.5973,
  },
  {
    x: 13.8819,
    y: -19.5086,
  },
  {
    x: 13.8315,
    y: -19.4244,
  },
  {
    x: 13.773,
    y: -19.3456,
  },
  {
    x: 13.7071,
    y: -19.2729,
  },
  {
    x: 13.6344,
    y: -19.207,
  },
  {
    x: 13.5556,
    y: -19.1485,
  },
  {
    x: 13.4714,
    y: -19.0981,
  },
  {
    x: 13.3827,
    y: -19.0561,
  },
  {
    x: 13.2903,
    y: -19.0231,
  },
  {
    x: 13.1951,
    y: -18.9992,
  },
  {
    x: 13.098,
    y: -18.9848,
  },
  {
    x: 13,
    y: -18.98,
  },
]

const BOARD_LAYER_COUNT = 4
const BOARD_THICKNESS_MM = 1
const BOARD_COPPER_LAYERS = ["top", "inner1", "inner2", "bottom"] as const

const groundPourOutline = [
  ...BOARD_OUTLINE.filter(({ y }) => y <= 14.08),
  { x: 16.9, y: 14.08 },
  { x: -16.9, y: 14.08 },
]

const BoardCopper = () => (
  <>
    <keepout
      shape="rect"
      pcbX={-1.5}
      pcbY={18.125}
      width="16.35mm"
      height="4.55mm"
      layers={[...BOARD_COPPER_LAYERS]}
      excludeRefs={[".AE1"]}
    />
    {BOARD_COPPER_LAYERS.map((layer) => (
      <Fragment key={layer}>
        <copperpour
          name={`GND_${layer.toUpperCase()}`}
          layer={layer}
          connectsTo="net.GND"
          outline={groundPourOutline}
          clearance="0.2032mm"
          boardEdgeMargin="0.3mm"
          cutoutMargin="0.3mm"
          useThermalReliefs
          coveredWithSolderMask
        />
      </Fragment>
    ))}
  </>
)

const CrystalRfRouting = () => (
  <>
    <bus
      name="CRYSTAL_RF"
      connections={[
        "XTAL_40M_OUT",
        "XTAL_40M_FB",
        "XTAL_40M_IN",
        "XTAL_32K_P",
        "XTAL_32K_N",
        "RF_ANT",
        "RF_IN",
      ]}
      pcbAllowedLayers={["top"]}
    />
    <trace
      name="XTAL_40M_OUT"
      path={[".Y2 > .pin1", ".C16 > .pin1", ".R12 > .pin2"]}
      schDisplayLabel="XTAL_40M_OUT"
    />
    <trace
      name="XTAL_40M_FB"
      path={[".Y2 > .pin3", ".U4 > .pin53", ".C19 > .pin1"]}
      schDisplayLabel="XTAL_40M_FB"
    />
    <trace
      name="XTAL_40M_IN"
      path={[".U4 > .pin54", ".R12 > .pin1"]}
      schDisplayLabel="XTAL_40M_IN"
    />
    <trace
      name="XTAL_32K_P"
      path={[".U4 > .pin21", ".C17 > .pin1", ".Y1 > .pin1"]}
      schDisplayLabel="XTAL_32K_P"
    />
    <trace
      name="XTAL_32K_N"
      path={[".U4 > .pin22", ".C18 > .pin1", ".Y1 > .pin2"]}
      schDisplayLabel="XTAL_32K_N"
    />
    <trace
      name="RF_ANT"
      path={[".L1 > .pin1", ".AE1 > .pin1", ".C7 > .pin1"]}
      schDisplayLabel="RF_ANT"
    />
    <trace
      name="RF_IN"
      path={[".L1 > .pin2", ".U4 > .pin1", ".C9 > .pin1"]}
      schDisplayLabel="RF_IN"
    />
  </>
)

const ao3400APinLabels = {
  pin1: ["pin1", "1", "gate", "G"],
  pin2: ["pin2", "2", "source", "S"],
  pin3: ["pin3", "3", "drain", "D"],
} as const
const AO3400A = (props: ChipProps<typeof ao3400APinLabels>) => {
  return (
    <mosfet
      manufacturerPartNumber="AO3400A"
      supplierPartNumbers={{ jlcpcb: ["C20917"] }}
      channelType="n"
      mosfetMode="enhancement"
      pinLabels={ao3400APinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="0.9375mm"
            pcbY="-0.95mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0.9375mm"
            pcbY="0.95mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="-0.9375mm"
            pcbY="0mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const AFC07_S24ECC_00_FOOTPRINT = (
  <footprint insertionDirection="from_bottom">
    <smtpad
      portHints={["pin1"]}
      pcbX="5.745099mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="5.245481mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin3"]}
      pcbX="4.745609mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin4"]}
      pcbX="4.245483mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin5"]}
      pcbX="3.745611mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin6"]}
      pcbX="3.245485mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin7"]}
      pcbX="2.745613mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin8"]}
      pcbX="2.245487mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin9"]}
      pcbX="1.745615mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin10"]}
      pcbX="1.245489mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin11"]}
      pcbX="0.745617mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin12"]}
      pcbX="0.245491mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin13"]}
      pcbX="-0.254381mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin14"]}
      pcbX="-0.754507mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin15"]}
      pcbX="-1.250569mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin16"]}
      pcbX="-1.753997mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin17"]}
      pcbX="-2.254377mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin18"]}
      pcbX="-2.753995mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin19"]}
      pcbX="-3.253867mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin20"]}
      pcbX="-3.756025mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin21"]}
      pcbX="-4.256405mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin22"]}
      pcbX="-4.756023mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin23"]}
      pcbX="-5.256403mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin24"]}
      pcbX="-5.756529mm"
      pcbY="1.62506025mm"
      width="0.299974mm"
      height="1.499997mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin25"]}
      pcbX="7.400925mm"
      pcbY="-0.87480775mm"
      width="1.999996mm"
      height="2.999994mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin25"]}
      pcbX="-7.400925mm"
      pcbY="-0.87506175mm"
      width="1.999996mm"
      height="2.999994mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: 8.769858, y: 0.8782240499999858 },
        { x: 8.769858, y: -3.324942550000017 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 8.269986000000003, y: 0.8782240499999858 },
        { x: 8.269986000000003, y: -3.324942550000017 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -8.231885999999989, y: 0.8774620499999912 },
        { x: -8.231885999999989, y: -3.324942550000017 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -8.871965999999986, y: 0.8774620499999912 },
        { x: -8.871965999999986, y: -3.324942550000017 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -8.871965999999986, y: -3.324942550000017 },
        { x: 8.769858, y: -3.324942550000017 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -8.871965999999986, y: 0.8782240499999858 },
        { x: 8.769858, y: 0.8782240499999858 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="-0.023241mm"
      pcbY="3.36572425mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -9.11244099999999, y: 2.6157242499999853 },
        { x: 9.06595900000002, y: 2.6157242499999853 },
        { x: 9.06595900000002, y: -4.005675750000023 },
        { x: -9.11244099999999, y: -4.005675750000023 },
        { x: -9.11244099999999, y: 2.6157242499999853 },
      ]}
    />
  </footprint>
)

const fpc24PinLabels = {
  pin1: ["NC", "pin1", "1"],
  pin2: ["GDR", "pin2", "2"],
  pin3: ["RESE", "pin3", "3"],
  pin4: ["NC", "pin4", "4"],
  pin5: ["VCOM", "pin5", "5"],
  pin6: ["NC", "pin6", "6"],
  pin7: ["NC", "pin7", "7"],
  pin8: ["GND", "pin8", "8"],
  pin9: ["BUSY", "pin9", "9"],
  pin10: ["RES", "pin10", "10"],
  pin11: ["DC", "pin11", "11"],
  pin12: ["CS", "pin12", "12"],
  pin13: ["SCK", "pin13", "13"],
  pin14: ["MOSI", "pin14", "14"],
  pin15: ["P3V3", "pin15", "15"],
  pin16: ["P3V3", "pin16", "16"],
  pin17: ["GND", "pin17", "17"],
  pin18: ["CAP1", "pin18", "18"],
  pin19: ["NC", "pin19", "19"],
  pin20: ["CAP2", "pin20", "20"],
  pin21: ["PREVGH", "pin21", "21"],
  pin22: ["CAP3", "pin22", "22"],
  pin23: ["PREVGL", "pin23", "23"],
  pin24: ["CAP4", "pin24", "24"],
  pin25: ["MOUNT", "pin25", "M"],
} as const
const FPC24 = (props: ChipProps<typeof fpc24PinLabels>) => {
  return (
    <connector
      pinCount={25}
      pinLabels={fpc24PinLabels}
      manufacturerPartNumber="AFC07-S24ECC-00"
      supplierPartNumbers={{ jlcpcb: ["C11092"] }}
      footprint={AFC07_S24ECC_00_FOOTPRINT}
      {...props}
    />
  )
}

const mbr0530PinLabels = {
  pin1: ["pin1", "1", "cathode", "neg"],
  pin2: ["pin2", "2", "anode", "pos"],
} as const
const MBR0530 = (props: ChipProps<typeof mbr0530PinLabels>) => {
  return (
    <diode
      schottky
      manufacturerPartNumber="MBR0530"
      pinLabels={mbr0530PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-1.65mm"
            pcbY="0mm"
            width="0.9mm"
            height="1.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="1.65mm"
            pcbY="0mm"
            width="0.9mm"
            height="1.2mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const srn401847uHPinLabels = {
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
} as const
const SRN4018_47uH = (props: ChipProps<typeof srn401847uHPinLabels>) => {
  return (
    <inductor
      manufacturerPartNumber="SRN4018-470M"
      inductance="47uH"
      maxCurrentRating="600mA"
      pinLabels={srn401847uHPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="1.4mm"
            pcbY="0mm"
            width="1.2mm"
            height="3.7mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-1.4mm"
            pcbY="0mm"
            width="1.2mm"
            height="3.7mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const schematicSheets = {
  mcu: "mcu-sheet",
  mcuSupport: "mcu-support-sheet",
  epaper: "epaper-sheet",
  epaperDriver: "epaper-sheet",
  power: "power-sheet",
  usb: "usb-sheet",
  accelerometer: "controls-sheet",
  buttons: "controls-sheet",
  motor: "controls-sheet",
} as const
const schematicSections = {
  mcu: "mcu",
  mcuClock: "mcu-clock",
  mcuRf: "mcu-rf",
  mcuReset: "mcu-reset",
  epaper: "epaper",
  epaperBias: "epaper",
  power: "power",
  powerRegulator: "power-regulator",
  powerMonitor: "power-monitor",
  usb: "usb",
  usbProtection: "usb-protection",
  accelerometer: "accelerometer",
  buttons: "buttons",
  motor: "motor",
} as const

const EpaperInterfaceComponents = () => (
  <>
    <AO3400A
      name="Q3"
      pcbX={11.24}
      pcbY={-13.77}
      pcbRotation={90}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <SRN4018_47uH
      name="L2"
      pcbX={-10.41}
      pcbY={-13.22}
      pcbRotation={90}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <MBR0530
      name="D5"
      pcbX={-11.05}
      pcbY={-7.16}
      pcbRotation={90}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <resistor
      name="R17"
      resistance="2.2Ω"
      footprint="0402"
      pcbX={4.7}
      pcbY={-2.4}
      pcbRotation={90}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <MBR0530
      name="D4"
      pcbX={-13.35}
      pcbY={-7.16}
      pcbRotation={90}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C21"
      capacitance="4.7uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0603"
      pcbX={-11.18}
      pcbY={-10.24}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C20"
      capacitance="4.7uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0603"
      pcbX={-11.18}
      pcbY={-16.2}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <resistor
      name="R16"
      resistance="1MΩ"
      footprint="0402"
      pcbX={5.7}
      pcbY={-2.4}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <MBR0530
      name="D3"
      pcbX={-15.65}
      pcbY={-7.16}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <FPC24
      name="J3"
      pcbX={0.05}
      pcbY={-6.39}
      schSectionName={schematicSections.epaper}
      schSheetName={schematicSheets.epaper}
      noConnect={["pin1", "pin4", "pin6", "pin7", "pin19", "pin25"]}
    />

    <capacitor
      name="C29"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={-5.96}
      pcbY={-2.4}
      pcbRotation={90}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C25"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={-2.96}
      pcbY={-2}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C27"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={0.65}
      pcbY={-2.4}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C22"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={-3.96}
      pcbY={-2}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C23"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={3.7}
      pcbY={-2.4}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C24"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={-1.96}
      pcbY={-2}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C28"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={-0.96}
      pcbY={-2.4}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <capacitor
      name="C26"
      capacitance="1uF"
      maxVoltageRating="50V"
      schShowRatings
      footprint="0402"
      pcbX={-4.96}
      pcbY={-2.4}
      pcbRotation={270}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
    <resistor
      name="R19"
      resistance="100kΩ"
      footprint="0402"
      pcbX={2.7}
      pcbY={-0.8}
      schSectionName={schematicSections.epaperBias}
      schSheetName={schematicSheets.epaperDriver}
    />
  </>
)
const EpaperInterfaceTraces = () => (
  <>
    <trace from=".Q3 > .pin1" to="net.GDR" />
    <trace from=".R16 > .pin1" to="net.GDR" />
    <trace from=".J3 > .pin2" to="net.GDR" />
    <trace from=".Q3 > .pin2" to="net.RESE" />
    <trace from=".R17 > .pin2" to="net.RESE" />
    <trace from=".J3 > .pin3" to="net.RESE" />
    <trace from=".Q3 > .pin3" to="net.EINK_BOOST_SW" />
    <trace from=".L2 > .pin1" to="net.EINK_BOOST_SW" />
    <trace from=".D5 > .pin2" to="net.EINK_BOOST_SW" />
    <trace from=".C21 > .pin2" to="net.EINK_BOOST_SW" />
    <trace from=".L2 > .pin2" to="net.P3V3" />
    <trace from=".C20 > .pin1" to="net.P3V3" />
    <trace from=".J3 > .pin15" to="net.P3V3" />
    <trace from=".J3 > .pin16" to="net.P3V3" />
    <trace from=".C28 > .pin1" to="net.P3V3" />
    <trace from=".R19 > .pin1" to="net.P3V3" />
    <trace from=".D5 > .pin1" to="net.PREVGH" />
    <trace from=".J3 > .pin21" to="net.PREVGH" />
    <trace from=".C22 > .pin1" to="net.PREVGH" />
    <trace from=".R17 > .pin1" to="net.GND" />
    <trace from=".D4 > .pin1" to="net.GND" />
    <trace from=".C20 > .pin2" to="net.GND" />
    <trace from=".R16 > .pin2" to="net.GND" />
    <trace from=".J3 > .pin8" to="net.GND" />
    <trace from=".J3 > .pin17" to="net.GND" />
    <trace from=".C29 > .pin1" to="net.GND" />
    <trace from=".C25 > .pin2" to="net.GND" />
    <trace from=".C27 > .pin2" to="net.GND" />
    <trace from=".C22 > .pin2" to="net.GND" />
    <trace from=".C23 > .pin2" to="net.GND" />
    <trace from=".C24 > .pin2" to="net.GND" />
    <trace from=".C28 > .pin2" to="net.GND" />
    <trace from=".C26 > .pin2" to="net.GND" />
    <trace from=".D4 > .pin2" to="net.EINK_VGL_PUMP" />
    <trace from=".C21 > .pin1" to="net.EINK_VGL_PUMP" />
    <trace from=".D3 > .pin1" to="net.EINK_VGL_PUMP" />
    <trace from=".D3 > .pin2" to="net.PREVGL" />
    <trace from=".J3 > .pin23" to="net.PREVGL" />
    <trace from=".C29 > .pin2" to="net.PREVGL" />
    <trace from=".J3 > .pin5" to="net.EINK_VCOM" />
    <trace from=".C23 > .pin1" to="net.EINK_VCOM" />
    <trace from=".J3 > .pin9" to="net.BUSY" />
    <trace from=".J3 > .pin10" to="net.RES" />
    <trace from=".R19 > .pin2" to="net.RES" />
    <trace from=".J3 > .pin11" to="net.DC" />
    <trace from=".J3 > .pin12" to="net.CS" />
    <trace from=".J3 > .pin13" to="net.SCK" />
    <trace from=".J3 > .pin14" to="net.MOSI" />
    <trace from=".J3 > .pin18" to="net.EINK_CAP1" />
    <trace from=".C24 > .pin1" to="net.EINK_CAP1" />
    <trace from=".J3 > .pin20" to="net.EINK_CAP2" />
    <trace from=".C25 > .pin1" to="net.EINK_CAP2" />
    <trace from=".J3 > .pin22" to="net.EINK_CAP3" />
    <trace from=".C26 > .pin1" to="net.EINK_CAP3" />
    <trace from=".J3 > .pin24" to="net.EINK_CAP4" />
    <trace from=".C27 > .pin1" to="net.EINK_CAP4" />
  </>
)

const crystal32KhzPinLabels = {
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
} as const
const Crystal_32Khz = (props: ChipProps<typeof crystal32KhzPinLabels>) => {
  return (
    <crystal
      frequency="32.768kHz"
      loadCapacitance="12.5pF"
      pinLabels={crystal32KhzPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="0.7mm"
            pcbY="0mm"
            width="0.6mm"
            height="1.1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-0.7mm"
            pcbY="0mm"
            width="0.6mm"
            height="1.1mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const crystal40MhzPinLabels = {
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
  pin3: ["pin3", "3"],
  pin4: ["pin4", "4"],
} as const
const Crystal_40Mhz = (props: ChipProps<typeof crystal40MhzPinLabels>) => {
  return (
    <crystal
      frequency="40MHz"
      pinVariant="four_pin"
      loadCapacitance="12pF"
      pinLabels={crystal40MhzPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-0.875mm"
            pcbY="-0.7mm"
            width="1.15mm"
            height="1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0.875mm"
            pcbY="-0.7mm"
            width="1.15mm"
            height="1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="0.875mm"
            pcbY="0.7mm"
            width="1.15mm"
            height="1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="-0.875mm"
            pcbY="0.7mm"
            width="1.15mm"
            height="1mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const esp32S3Fn8PinLabels = {
  pin36: ["SPICLK_N_GPIO48", "pin36", "36"],
  pin37: ["SPICLK_P_GPIO47", "pin37", "37"],
  pin1: ["LNA_IN_RF", "pin1", "1"],
  pin10: ["GPIO5_ADC1_CH4", "pin10", "10"],
  pin11: ["GPIO6_ADC1_CH5", "pin11", "11"],
  pin12: ["GPIO7_ADC1_CH6", "pin12", "12"],
  pin13: ["GPIO8_ADC1_CH7", "pin13", "13"],
  pin14: ["GPIO9_ADC1_CH8", "pin14", "14"],
  pin15: ["GPIO10_ADC1_CH9", "pin15", "15"],
  pin16: ["GPIO11_ADC2_CH0", "pin16", "16"],
  pin17: ["GPIO12_ADC2_CH1", "pin17", "17"],
  pin18: ["GPIO13_ADC2_CH2", "pin18", "18"],
  pin19: ["GPIO14_ADC2_CH3", "pin19", "19"],
  pin2: ["VDD3P3_2", "pin2", "2"],
  pin20: ["VDD3P3_RTC", "pin20", "20"],
  pin21: ["GPIO15_ADC2_CH4_XTAL_32K_P", "pin21", "21"],
  pin22: ["GPIO16_ADC2_CH5_XTAL_32K_N", "pin22", "22"],
  pin23: ["GPIO17_ADC2_CH6_DAC_2", "pin23", "23"],
  pin24: ["GPIO18_ADC2_CH7_DAC_1", "pin24", "24"],
  pin25: ["GPIO19_USB_D_ADC2_CH8", "pin25", "25"],
  pin26: ["GPIO20_USB_D_ADC2_CH9", "pin26", "26"],
  pin27: ["GPIO21", "pin27", "27"],
  pin28: ["SPI_CS1_GPIO26", "pin28", "28"],
  pin29: ["VDD_SPI", "pin29", "29"],
  pin3: ["VDD3P3_3", "pin3", "3"],
  pin30: ["SPIHD_GPIO27", "pin30", "30"],
  pin31: ["SPIWP_GPIO28", "pin31", "31"],
  pin32: ["SPICS0_GPIO29", "pin32", "32"],
  pin33: ["SPICLK_GPIO30", "pin33", "33"],
  pin34: ["SPIQ_GPIO31", "pin34", "34"],
  pin35: ["SPID_GPIO32", "pin35", "35"],
  pin38: ["GPIO33", "pin38", "38"],
  pin39: ["GPIO34", "pin39", "39"],
  pin4: ["CHIP_PU_RESET", "pin4", "4"],
  pin40: ["GPIO35", "pin40", "40"],
  pin41: ["GPIO36", "pin41", "41"],
  pin42: ["GPIO37", "pin42", "42"],
  pin43: ["GPIO38", "pin43", "43"],
  pin44: ["MTCK_JTAG_GPIO39", "pin44", "44"],
  pin45: ["MTDO_JTAG_GPIO40", "pin45", "45"],
  pin46: ["VDD3P3_CPU", "pin46", "46"],
  pin47: ["MTDI_JTAG_GPIO41", "pin47", "47"],
  pin48: ["MTMS_JTAG_GPIO42", "pin48", "48"],
  pin49: ["U0TXD_PROG_GPIO43", "pin49", "49"],
  pin5: ["GPIO0_BOOT", "pin5", "5"],
  pin50: ["U0RXD_PROG_GPIO44", "pin50", "50"],
  pin51: ["GPIO45", "pin51", "51"],
  pin52: ["GPIO46", "pin52", "52"],
  pin53: ["XTAL_N", "pin53", "53"],
  pin54: ["XTAL_P", "pin54", "54"],
  pin55: ["VDDA_55", "pin55", "55"],
  pin56: ["VDDA_56", "pin56", "56"],
  pin57: ["GND", "pin57", "57"],
  pin6: ["GPIO1_ADC1_CH0", "pin6", "6"],
  pin7: ["GPIO2_ADC1_CH1", "pin7", "7"],
  pin8: ["GPIO3_ADC1_CH2", "pin8", "8"],
  pin9: ["GPIO4_ADC1_CH3", "pin9", "9"],
} as const
const ESP32_S3FN8 = (props: ChipProps<typeof esp32S3Fn8PinLabels>) => {
  return (
    <chip
      manufacturerPartNumber="ESP32-S3FN8"
      supplierPartNumbers={{ jlcpcb: ["C2913196"] }}
      displayName="ESP32-S3FN8"
      pinAttributes={{
        pin2: { requiresPower: true, requiresVoltage: "3.3V" },
        pin3: { requiresPower: true, requiresVoltage: "3.3V" },
        pin20: { requiresPower: true, requiresVoltage: "3.3V" },
        pin46: { requiresPower: true, requiresVoltage: "3.3V" },
        pin55: { requiresPower: true, requiresVoltage: "3.3V" },
        pin56: { requiresPower: true, requiresVoltage: "3.3V" },
        pin57: { requiresGround: true },
      }}
      pinLabels={esp32S3Fn8PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="3.4375mm"
            pcbY="-2.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="3.4375mm"
            pcbY="-2.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="3.4375mm"
            pcbY="-1.8mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="3.4375mm"
            pcbY="-1.4mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5", "5"]}
            pcbX="3.4375mm"
            pcbY="-1mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6", "6"]}
            pcbX="3.4375mm"
            pcbY="-0.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7", "7"]}
            pcbX="3.4375mm"
            pcbY="-0.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8", "8"]}
            pcbX="3.4375mm"
            pcbY="0.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9", "9"]}
            pcbX="3.4375mm"
            pcbY="0.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10", "10"]}
            pcbX="3.4375mm"
            pcbY="1mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11", "11"]}
            pcbX="3.4375mm"
            pcbY="1.4mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12", "12"]}
            pcbX="3.4375mm"
            pcbY="1.8mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13", "13"]}
            pcbX="3.4375mm"
            pcbY="2.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14", "14"]}
            pcbX="3.4375mm"
            pcbY="2.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15", "15"]}
            pcbX="2.6mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16", "16"]}
            pcbX="2.2mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17", "17"]}
            pcbX="1.8mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18", "18"]}
            pcbX="1.4mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19", "19"]}
            pcbX="1mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20", "20"]}
            pcbX="0.6mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21", "21"]}
            pcbX="0.2mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22", "22"]}
            pcbX="-0.2mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23", "23"]}
            pcbX="-0.6mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24", "24"]}
            pcbX="-1mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25", "25"]}
            pcbX="-1.4mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26", "26"]}
            pcbX="-1.8mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27", "27"]}
            pcbX="-2.2mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28", "28"]}
            pcbX="-2.6mm"
            pcbY="3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29", "29"]}
            pcbX="-3.4375mm"
            pcbY="2.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30", "30"]}
            pcbX="-3.4375mm"
            pcbY="2.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31", "31"]}
            pcbX="-3.4375mm"
            pcbY="1.8mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32", "32"]}
            pcbX="-3.4375mm"
            pcbY="1.4mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33", "33"]}
            pcbX="-3.4375mm"
            pcbY="1mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34", "34"]}
            pcbX="-3.4375mm"
            pcbY="0.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35", "35"]}
            pcbX="-3.4375mm"
            pcbY="0.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36", "36"]}
            pcbX="-3.4375mm"
            pcbY="-0.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37", "37"]}
            pcbX="-3.4375mm"
            pcbY="-0.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38", "38"]}
            pcbX="-3.4375mm"
            pcbY="-1mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39", "39"]}
            pcbX="-3.4375mm"
            pcbY="-1.4mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40", "40"]}
            pcbX="-3.4375mm"
            pcbY="-1.8mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41", "41"]}
            pcbX="-3.4375mm"
            pcbY="-2.2mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin42", "42"]}
            pcbX="-3.4375mm"
            pcbY="-2.6mm"
            width="0.875mm"
            height="0.2mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin43", "43"]}
            pcbX="-2.6mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin44", "44"]}
            pcbX="-2.2mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin45", "45"]}
            pcbX="-1.8mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin46", "46"]}
            pcbX="-1.4mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin47", "47"]}
            pcbX="-1mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin48", "48"]}
            pcbX="-0.6mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin49", "49"]}
            pcbX="-0.2mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin50", "50"]}
            pcbX="0.2mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin51", "51"]}
            pcbX="0.6mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin52", "52"]}
            pcbX="1mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin53", "53"]}
            pcbX="1.4mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin54", "54"]}
            pcbX="1.8mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin55", "55"]}
            pcbX="2.2mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin56", "56"]}
            pcbX="2.6mm"
            pcbY="-3.4375mm"
            width="0.2mm"
            height="0.875mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin57", "57"]}
            pcbX="0mm"
            pcbY="0mm"
            width="4mm"
            height="4mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const sr2HaruPinLabels = {
  pin1: ["VSS", "pin1", "1"],
  pin2: ["SR1", "pin2", "2"],
  pin3: ["RST", "pin3", "3"],
  pin4: ["NC", "pin4", "4"],
  pin5: ["SR0", "pin5", "5"],
  pin6: ["VCC", "pin6", "6"],
} as const
const SR2HARU = (props: ChipProps<typeof sr2HaruPinLabels>) => {
  return (
    <chip
      manufacturerPartNumber="SR2HARU"
      supplierPartNumbers={{ jlcpcb: ["C2066502"] }}
      pinAttributes={{
        pin1: { requiresGround: true },
        pin2: { isInput: true },
        pin3: { isOutput: true },
        pin4: { doNotConnect: true },
        pin5: { isInput: true },
        pin6: { requiresPower: true },
      }}
      pinLabels={sr2HaruPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-0.4mm"
            pcbY="-0.8mm"
            width="0.2mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0mm"
            pcbY="-0.8mm"
            width="0.2mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="0.4mm"
            pcbY="-0.8mm"
            width="0.2mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="0.4mm"
            pcbY="0.8mm"
            width="0.2mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5", "5"]}
            pcbX="0mm"
            pcbY="0.8mm"
            width="0.2mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6", "6"]}
            pcbX="-0.4mm"
            pcbY="0.8mm"
            width="0.2mm"
            height="0.8mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const SWRA117DSymbol = () => (
  <symbol>
    <schematictext
      text="{NAME}"
      schY={0.4}
      fontSize={0.1}
      anchor="right"
      color="rgb(132, 0, 0)"
    />
    <schematictext
      text="SWRA117D Antenna"
      schY={0.25}
      fontSize={0.1}
      anchor="right"
      color="rgb(132, 0, 0)"
    />
    <schematicline x1={-0.2} y1={0} x2={-0.2} y2={-0.05} strokeWidth={0.02} />
    <schematicline x1={-0.2} y1={0} x2={-0.1} y2={0} strokeWidth={0.02} />
    <schematicline x1={-0.1} y1={0.1} x2={-0.1} y2={-0.1} strokeWidth={0.02} />
    <schematicline x1={0.1} y1={0.1} x2={0.1} y2={-0.1} strokeWidth={0.02} />
    <schematicline x1={0.1} y1={0} x2={0.2} y2={0} strokeWidth={0.02} />
    <schematicline x1={0.2} y1={0.55} x2={0.2} y2={-0.15} strokeWidth={0.02} />
    <schematicline x1={0.3} y1={0.55} x2={0.2} y2={0.15} strokeWidth={0.02} />
    <schematicline x1={0.2} y1={0.15} x2={0.1} y2={0.55} strokeWidth={0.02} />
    <schematicrect width={0.1} height={0.2} strokeWidth={0.02} />
    <port
      name="pin1"
      pinNumber={1}
      schX={-0.2}
      schY={-0.2}
      direction="down"
      schStemLength={0.15}
    />
    <port
      name="pin2"
      pinNumber={2}
      schX={0.2}
      schY={-0.2}
      direction="down"
      schStemLength={0.05}
    />
  </symbol>
)

const swra117DPinLabels = {
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
} as const
const SWRA117D = (props: ChipProps<typeof swra117DPinLabels>) => {
  return (
    <chip
      doNotPlace
      symbol={<SWRA117DSymbol />}
      displayName="AE1 Antenna"
      pinAttributes={{
        pin1: { isPassive: true, requiresPower: true },
        pin2: { isPassive: true, requiresPower: false, requiresGround: true },
      }}
      pinLabels={swra117DPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-1.15mm"
            pcbY="0mm"
            width="0.5mm"
            height="0.5mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0.95mm"
            pcbY="0mm"
            width="0.9mm"
            height="0.5mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const McuCoreComponents = () => (
  <>
    <testpoint
      name="TP8"
      doNotPlace
      pcbX={8.32}
      pcbY={-12.69}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <testpoint
      name="TP9"
      doNotPlace
      pcbX={8.32}
      pcbY={-15.23}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C3"
      capacitance="1uF"
      footprint="0402"
      pcbX={-0.5}
      pcbY={13.19}
      pcbRotation={270}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C2"
      capacitance="1uF"
      footprint="0402"
      pcbX={-1.55}
      pcbY={13.19}
      pcbRotation={270}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <Crystal_40Mhz
      name="Y2"
      pcbX={6.7}
      pcbY={8.5}
      pcbRotation={180}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
    <testpoint
      name="TP5"
      doNotPlace
      pcbX={-0.8}
      pcbY={-0.7}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C6"
      capacitance="100nF"
      footprint="0402"
      pcbX={2.1}
      pcbY={11.7}
      pcbRotation={180}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <inductor
      name="L1"
      inductance="7.5nH"
      footprint="0402"
      pcbX={3.55}
      pcbY={12.27}
      pcbRotation={270}
      schSectionName={schematicSections.mcuRf}
      schSheetName={schematicSheets.mcuSupport}
    />
    <ESP32_S3FN8
      name="U4"
      pcbX={0.52}
      pcbY={7.22}
      pcbRotation={90}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <testpoint
      name="TP6"
      doNotPlace
      pcbX={-2.61}
      pcbY={-0.45}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C15"
      capacitance="1uF"
      footprint="0402"
      pcbX={-1.6}
      pcbY={1.55}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <testpoint
      name="TP2"
      doNotPlace
      pcbX={8.5}
      pcbY={11.8}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <resistor
      name="R1"
      resistance="10kΩ"
      footprint="0402"
      pcbX={-2.6}
      pcbY={14.7}
      pcbRotation={270}
      schSectionName={schematicSections.mcuReset}
      schSheetName={schematicSheets.mcuSupport}
    />
    <capacitor
      name="C9"
      capacitance="3pF"
      footprint="0402"
      pcbX={5.1}
      pcbY={12.65}
      schSectionName={schematicSections.mcuRf}
      schSheetName={schematicSheets.mcuSupport}
    />
    <capacitor
      name="C4"
      capacitance="1uF"
      footprint="0402"
      pcbX={6.05}
      pcbY={11.7}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C1"
      capacitance="10uF"
      footprint="0402"
      pcbX={7.8}
      pcbY={13}
      pcbRotation={180}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <SWRA117D
      name="AE1"
      pcbX={4.275}
      pcbY={13.7}
      schSectionName={schematicSections.mcuRf}
      schSheetName={schematicSheets.mcuSupport}
    />
    <testpoint
      name="TP1"
      doNotPlace
      pcbX={8.5}
      pcbY={5.7}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0402"
      pcbX={0.55}
      pcbY={13.19}
      pcbRotation={270}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C16"
      capacitance="26pF"
      footprint="0402"
      pcbX={7.6}
      pcbY={10.65}
      pcbRotation={90}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
    <capacitor
      name="C19"
      capacitance="26pF"
      footprint="0402"
      pcbX={4.95}
      pcbY={6.75}
      pcbRotation={270}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
    <capacitor
      name="C7"
      capacitance="3pF"
      footprint="0402"
      pcbX={2.1}
      pcbY={12.91}
      pcbRotation={180}
      schSectionName={schematicSections.mcuRf}
      schSheetName={schematicSheets.mcuSupport}
    />
    <testpoint
      name="TP7"
      doNotPlace
      pcbX={-3.51}
      pcbY={1.34}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C18"
      capacitance="10pF"
      footprint="0402"
      pcbX={-7.17}
      pcbY={6.9}
      pcbRotation={180}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
    <testpoint
      name="TP3"
      doNotPlace
      pcbX={-5.34}
      pcbY={4.71}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <testpoint
      name="TP4"
      doNotPlace
      pcbX={1.13}
      pcbY={1}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <capacitor
      name="C17"
      capacitance="10pF"
      footprint="0402"
      pcbX={-7.17}
      pcbY={8.57}
      pcbRotation={180}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
    <resistor
      name="R12"
      resistance="1MΩ"
      footprint="0402"
      pcbX={6.1}
      pcbY={10.15}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
    <capacitor
      name="C13"
      capacitance="100nF"
      footprint="0402"
      pcbX={-1.6}
      pcbY={2.65}
      schSectionName={schematicSections.mcu}
      schSheetName={schematicSheets.mcu}
    />
    <SR2HARU
      name="U1"
      pcbX={-8.65}
      pcbY={10.47}
      pcbRotation={180}
      schSectionName={schematicSections.mcuReset}
      schSheetName={schematicSheets.mcuSupport}
    />
    <Crystal_32Khz
      name="Y1"
      pcbX={-5.36}
      pcbY={7.73}
      pcbRotation={90}
      schSectionName={schematicSections.mcuClock}
      schSheetName={schematicSheets.mcuSupport}
    />
  </>
)
const McuCoreTraces = () => (
  <>
    <trace from=".TP8 > .pin1" to="net.P3V3" />
    <trace from=".C3 > .pin1" to="net.P3V3" />
    <trace from=".C6 > .pin1" to="net.P3V3" />
    <trace from=".U4 > .pin2" to="net.P3V3" />
    <trace from=".U4 > .pin3" to="net.P3V3" />
    <trace from=".U4 > .pin20" to="net.P3V3" />
    <trace from=".U4 > .pin46" to="net.P3V3" />
    <trace from=".U4 > .pin55" to="net.P3V3" />
    <trace from=".U4 > .pin56" to="net.P3V3" />
    <trace from=".R1 > .pin2" to="net.P3V3" />
    <trace from=".C4 > .pin1" to="net.P3V3" />
    <trace from=".C1 > .pin1" to="net.P3V3" />
    <trace from=".C5 > .pin1" to="net.P3V3" />
    <trace from=".TP4 > .pin1" to="net.P3V3" />
    <trace from=".U1 > .pin6" to="net.P3V3" />
    <trace from=".TP9 > .pin1" to="net.GND" />
    <trace from=".C3 > .pin2" to="net.GND" />
    <trace from=".C2 > .pin2" to="net.GND" />
    <trace from=".Y2 > .pin2" to="net.GND" />
    <trace from=".Y2 > .pin4" to="net.GND" />
    <trace from=".TP5 > .pin1" to="net.GND" />
    <trace from=".C6 > .pin2" to="net.GND" />
    <trace from=".U4 > .pin57" to="net.GND" />
    <trace from=".C15 > .pin2" to="net.GND" />
    <trace from=".C9 > .pin2" to="net.GND" />
    <trace from=".C4 > .pin2" to="net.GND" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".AE1 > .pin2" to="net.GND" />
    <trace from=".C5 > .pin2" to="net.GND" />
    <trace from=".C16 > .pin2" to="net.GND" />
    <trace from=".C19 > .pin2" to="net.GND" />
    <trace from=".C7 > .pin2" to="net.GND" />
    <trace from=".C18 > .pin2" to="net.GND" />
    <trace from=".C17 > .pin2" to="net.GND" />
    <trace from=".C13 > .pin2" to="net.GND" />
    <trace from=".U1 > .pin1" to="net.GND" />
    <trace from=".U4 > .pin41" to="net.BUSY" />
    <trace from=".U4 > .pin40" to="net.RES" />
    <trace from=".U4 > .pin39" to="net.DC" />
    <trace from=".U4 > .pin38" to="net.CS" />
    <trace from=".U4 > .pin37" to="net.SCK" />
    <trace from=".U4 > .pin36" to="net.MOSI" />
    <trace from=".C2 > .pin1" to="net.EN" />
    <trace from=".U4 > .pin4" to="net.EN" />
    <trace from=".R1 > .pin1" to="net.EN" />
    <trace from=".U1 > .pin3" to="net.EN" />
    <trace from=".U4 > .pin12" to="net.BTN1" />
    <trace from=".U4 > .pin11" to="net.BTN2" />
    <trace from=".U1 > .pin2" to="net.BTN2" />
    <trace from=".U4 > .pin23" to="net.VIB_PWM" />
    <trace from=".U4 > .pin5" to="net.BTN3" />
    <trace from=".TP3 > .pin1" to="net.BTN3" />
    <trace from=".U1 > .pin5" to="net.BTN3" />
    <trace from=".U4 > .pin13" to="net.BTN4" />
    <trace from=".U4 > .pin14" to="net.ADC" />
    <trace from=".U4 > .pin15" to="net.STAT" />
    <trace from=".U4 > .pin16" to="net.SCL" />
    <trace from=".TP6 > .pin1" to="net.SCL" />
    <trace from=".U4 > .pin17" to="net.SDA" />
    <trace from=".TP7 > .pin1" to="net.SDA" />
    <trace from=".U4 > .pin18" to="net.ACC_INT_2" />
    <trace from=".U4 > .pin19" to="net.ACC_INT_1" />
    <trace from=".U4 > .pin25" to="net.USB_DM_MCU" />
    <trace from=".U4 > .pin26" to="net.USB_DP_MCU" />
    <trace from=".U4 > .pin27" to="net.USB_DET" />
    <trace from=".U4 > .pin29" to="net.VDD" />
    <trace from=".C15 > .pin1" to="net.VDD" />
    <trace from=".C13 > .pin1" to="net.VDD" />
    <trace from=".U4 > .pin49" to="net.UART_TX" />
    <trace from=".TP1 > .pin1" to="net.UART_TX" />
    <trace from=".U4 > .pin50" to="net.UART_RX" />
    <trace from=".TP2 > .pin1" to="net.UART_RX" />
  </>
)

const batteryConnectorPinLabels = {
  pin3: ["pin3", "shield1"],
  pin4: ["pin4", "shield2"],
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
} as const
const BatteryConnector = (
  props: ChipProps<typeof batteryConnectorPinLabels>,
) => {
  return (
    <connector
      pinCount={4}
      manufacturerPartNumber="532610271"
      pinLabels={batteryConnectorPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin3", "shield1"]}
            pcbX="3.166mm"
            pcbY="-1.1mm"
            width="2.1mm"
            height="2.9mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "shield2"]}
            pcbX="-3.166mm"
            pcbY="-1.1mm"
            width="2.1mm"
            height="2.9mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="0.634mm"
            pcbY="1.75mm"
            width="0.5mm"
            height="1.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-0.616mm"
            pcbY="1.75mm"
            width="0.5mm"
            height="1.6mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const cj2301PinLabels = {
  pin1: ["pin1", "1", "gate", "G"],
  pin2: ["pin2", "2", "source", "S"],
  pin3: ["pin3", "3", "drain", "D"],
} as const
const CJ2301 = (props: ChipProps<typeof cj2301PinLabels>) => {
  return (
    <mosfet
      manufacturerPartNumber="CJ2301"
      supplierPartNumbers={{ jlcpcb: ["C2910170"] }}
      channelType="p"
      mosfetMode="enhancement"
      pinLabels={cj2301PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="0.9375mm"
            pcbY="-0.95mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0.9375mm"
            pcbY="0.95mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="-0.9375mm"
            pcbY="0mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const rt908033PinLabels = {
  pin1: ["VIN", "pin1", "1"],
  pin2: ["GND", "pin2", "2"],
  pin3: ["EN", "pin3", "3"],
  pin4: ["NC", "pin4", "4"],
  pin5: ["VOUT", "pin5", "5"],
} as const
const RT9080_33 = (props: ChipProps<typeof rt908033PinLabels>) => {
  return (
    <chip
      manufacturerPartNumber="RT9080-33GJ5"
      supplierPartNumbers={{ jlcpcb: ["C841192"] }}
      pinAttributes={{
        pin1: { requiresPower: true },
        pin2: { requiresGround: true },
        pin3: { isInput: true },
        pin4: { isPassive: true },
        pin5: { providesPower: true, providesVoltage: "3.3V" },
      }}
      pinLabels={rt908033PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-1.1375mm"
            pcbY="0.95mm"
            width="1.325mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-1.1375mm"
            pcbY="0mm"
            width="1.325mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="-1.1375mm"
            pcbY="-0.95mm"
            width="1.325mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="1.1375mm"
            pcbY="-0.95mm"
            width="1.325mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5", "5"]}
            pcbX="1.1375mm"
            pcbY="0.95mm"
            width="1.325mm"
            height="0.6mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const tp4054PinLabels = {
  pin1: ["STAT", "pin1", "1"],
  pin2: ["VSS", "pin2", "2"],
  pin3: ["VBAT", "pin3", "3"],
  pin4: ["VDD", "pin4", "4"],
  pin5: ["PROG", "pin5", "5"],
} as const
const TP4054 = (props: ChipProps<typeof tp4054PinLabels>) => {
  return (
    <chip
      manufacturerPartNumber="TP4054"
      supplierPartNumbers={{ jlcpcb: ["C382138"] }}
      pinAttributes={{
        pin1: { isOutput: true },
        pin2: { requiresGround: true },
        pin3: { providesPower: true },
        pin4: { requiresPower: true },
        pin5: { isPassive: true },
      }}
      pinLabels={tp4054PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="1.1mm"
            pcbY="-0.95mm"
            width="1.06mm"
            height="0.65mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="1.1mm"
            pcbY="0mm"
            width="1.06mm"
            height="0.65mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="1.1mm"
            pcbY="0.95mm"
            width="1.06mm"
            height="0.65mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="-1.1mm"
            pcbY="0.95mm"
            width="1.06mm"
            height="0.65mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5", "5"]}
            pcbX="-1.1mm"
            pcbY="-0.95mm"
            width="1.06mm"
            height="0.65mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const PowerSupplyComponents = () => (
  <>
    <TP4054
      name="U3"
      pcbX={15.1}
      pcbY={-7.05}
      pcbRotation={90}
      schSectionName={schematicSections.power}
      schSheetName={schematicSheets.power}
    />
    <BatteryConnector
      name="J1"
      pcbX={12.25}
      pcbY={8.5}
      pcbRotation={270}
      schSectionName={schematicSections.powerRegulator}
      schSheetName={schematicSheets.power}
      noConnect={["pin3", "pin4"]}
    />
    <capacitor
      name="C10"
      capacitance="10uF"
      footprint="0402"
      pcbX={7.2}
      pcbY={-2.4}
      pcbRotation={270}
      schSectionName={schematicSections.powerRegulator}
      schSheetName={schematicSheets.power}
    />
    <resistor
      name="R2"
      resistance="100kΩ"
      footprint="0402"
      pcbX={11.95}
      pcbY={-9.92}
      pcbRotation={90}
      schSectionName={schematicSections.power}
      schSheetName={schematicSheets.power}
    />
    <resistor
      name="R5"
      resistance="51kΩ"
      footprint="0402"
      pcbX={10.9}
      pcbY={-9.92}
      pcbRotation={90}
      schSectionName={schematicSections.power}
      schSheetName={schematicSheets.power}
    />
    <resistor
      name="R3"
      resistance="10kΩ"
      footprint="0402"
      pcbX={13}
      pcbY={-9.92}
      pcbRotation={270}
      schSectionName={schematicSections.power}
      schSheetName={schematicSheets.power}
    />
    <CJ2301
      name="Q1"
      pcbX={11.6}
      pcbY={-7.07}
      pcbRotation={90}
      schSectionName={schematicSections.powerRegulator}
      schSheetName={schematicSheets.power}
    />
    <capacitor
      name="C11"
      capacitance="100nF"
      footprint="0402"
      pcbX={15.62}
      pcbY={4.7}
      schSectionName={schematicSections.powerMonitor}
      schSheetName={schematicSheets.power}
    />
    <RT9080_33
      name="U2"
      pcbX={9.7}
      pcbY={-3.45}
      pcbRotation={180}
      schSectionName={schematicSections.powerRegulator}
      schSheetName={schematicSheets.power}
    />
    <resistor
      name="R9"
      resistance="360kΩ"
      footprint="0402"
      pcbX={15.64}
      pcbY={5.8}
      schSectionName={schematicSections.powerMonitor}
      schSheetName={schematicSheets.power}
    />
    <resistor
      name="R8"
      resistance="100kΩ"
      footprint="0402"
      pcbX={15.04}
      pcbY={6.9}
      pcbRotation={180}
      schSectionName={schematicSections.powerMonitor}
      schSheetName={schematicSheets.power}
    />
    <resistor
      name="R6"
      resistance="100kΩ"
      footprint="0402"
      pcbX={9.85}
      pcbY={-9.92}
      pcbRotation={270}
      schSectionName={schematicSections.power}
      schSheetName={schematicSheets.power}
    />
    <MBR0530
      name="D1"
      pcbX={9.16}
      pcbY={-0.6}
      schSectionName={schematicSections.powerRegulator}
      schSheetName={schematicSheets.power}
    />
  </>
)
const PowerSupplyTraces = () => (
  <>
    <trace from=".C10 > .pin1" to="net.P3V3" />
    <trace from=".U2 > .pin5" to="net.P3V3" />
    <trace from=".U3 > .pin2" to="net.GND" />
    <trace from=".J1 > .pin2" to="net.GND" />
    <trace from=".C10 > .pin2" to="net.GND" />
    <trace from=".R2 > .pin2" to="net.GND" />
    <trace from=".R3 > .pin1" to="net.GND" />
    <trace from=".C11 > .pin2" to="net.GND" />
    <trace from=".U2 > .pin2" to="net.GND" />
    <trace from=".R9 > .pin2" to="net.GND" />
    <trace from=".U3 > .pin1" to="net.CHARGE_STATUS_RAW" />
    <trace from=".R6 > .pin2" to="net.CHARGE_STATUS_RAW" />
    <trace from=".U3 > .pin3" to="net.PBATT" />
    <trace from=".J1 > .pin1" to="net.PBATT" />
    <trace from=".Q1 > .pin3" to="net.PBATT" />
    <trace from=".R8 > .pin1" to="net.PBATT" />
    <trace from=".U3 > .pin4" to="net.VBUS" />
    <trace from=".R2 > .pin1" to="net.VBUS" />
    <trace from=".R5 > .pin1" to="net.VBUS" />
    <trace from=".Q1 > .pin1" to="net.VBUS" />
    <trace from=".D1 > .pin2" to="net.VBUS" />
    <trace from=".U3 > .pin5" to="net.CHARGE_PROGRAM" />
    <trace from=".R3 > .pin2" to="net.CHARGE_PROGRAM" />
    <trace from=".C11 > .pin1" to="net.ADC" />
    <trace from=".R9 > .pin1" to="net.ADC" />
    <trace from=".R8 > .pin2" to="net.ADC" />
    <trace from=".R5 > .pin2" to="net.STAT" />
    <trace from=".R6 > .pin1" to="net.STAT" />
    <trace from=".Q1 > .pin2" to="net.LDO_IN" />
    <trace from=".U2 > .pin1" to="net.LDO_IN" />
    <trace from=".U2 > .pin3" to="net.LDO_IN" />
    <trace from=".D1 > .pin1" to="net.LDO_IN" />
  </>
)

const SchematicSheets = () => (
  <>
    <schematicsheet
      name="mcu-sheet"
      displayName="1 · ESP32-S3 Core"
      sheetIndex={1}
    >
      <schematicsection name="mcu" displayName="ESP32-S3 Core" />
    </schematicsheet>
    <schematicsheet
      name="mcu-support-sheet"
      displayName="2 · Clocks, RF & Reset"
      sheetIndex={2}
    >
      <schematicsection name="mcu-clock" displayName="Clocks" />
      <schematicsection name="mcu-rf" displayName="RF & Antenna" />
      <schematicsection name="mcu-reset" displayName="Reset & Boot" />
    </schematicsheet>
    <schematicsheet
      name="power-sheet"
      displayName="3 · Power & Battery Monitor"
      sheetIndex={3}
    >
      <schematicsection name="power" displayName="Battery Charging" />
      <schematicsection name="power-regulator" displayName="3.3 V Regulator" />
      <schematicsection name="power-monitor" displayName="Battery Monitor" />
    </schematicsheet>
    <schematicsheet
      name="usb-sheet"
      displayName="4 · USB Interface"
      sheetIndex={4}
    >
      <schematicsection name="usb" displayName="USB Connector" />
      <schematicsection name="usb-protection" displayName="USB Protection" />
    </schematicsheet>
    <schematicsheet
      name="epaper-sheet"
      displayName="5 · E-Paper Display"
      sheetIndex={5}
    >
      <schematicsection name="epaper" displayName="E-Paper Display" />
    </schematicsheet>
    <schematicsheet
      name="controls-sheet"
      displayName="6 · Sensors & Controls"
      sheetIndex={6}
    >
      <schematicsection name="accelerometer" displayName="Accelerometer" />
      <schematicsection name="buttons" displayName="Buttons" />
      <schematicsection name="motor" displayName="Vibration Motor" />
    </schematicsheet>
  </>
)

const bma423PinLabels = {
  pin1: ["SDO", "pin1", "1"],
  pin10: ["CSB", "pin10", "10"],
  pin11: ["ASCL", "pin11", "11"],
  pin12: ["SCX", "pin12", "12"],
  pin2: ["SDX", "pin2", "2"],
  pin3: ["VDDIO", "pin3", "3"],
  pin4: ["ASDA", "pin4", "4"],
  pin5: ["INT1", "pin5", "5"],
  pin6: ["INT2", "pin6", "6"],
  pin7: ["VDD", "pin7", "7"],
  pin8: ["GNDIO", "pin8", "8"],
  pin9: ["GND", "pin9", "9"],
} as const
const BMA423 = (props: ChipProps<typeof bma423PinLabels>) => {
  return (
    <chip
      manufacturerPartNumber="BMA423"
      supplierPartNumbers={{ jlcpcb: ["C189517"] }}
      pinAttributes={{
        pin1: { isBidirectional: true },
        pin2: { isBidirectional: true },
        pin3: { requiresPower: true },
        pin4: { isBidirectional: true },
        pin5: { isBidirectional: true },
        pin6: { isBidirectional: true },
        pin7: { requiresPower: true },
        pin8: { requiresGround: true },
        pin9: { requiresGround: true },
        pin10: { isInput: true },
        pin11: { isOutput: true },
        pin12: { isInput: true },
      }}
      pinLabels={bma423PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-0.7625mm"
            pcbY="0.75mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-0.7625mm"
            pcbY="0.25mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="-0.7625mm"
            pcbY="-0.25mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="-0.7625mm"
            pcbY="-0.75mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5", "5"]}
            pcbX="-0.25mm"
            pcbY="-0.7625mm"
            width="0.35mm"
            height="0.375mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6", "6"]}
            pcbX="0.25mm"
            pcbY="-0.7625mm"
            width="0.35mm"
            height="0.375mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7", "7"]}
            pcbX="0.7625mm"
            pcbY="-0.75mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8", "8"]}
            pcbX="0.7625mm"
            pcbY="-0.25mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9", "9"]}
            pcbX="0.7625mm"
            pcbY="0.25mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10", "10"]}
            pcbX="0.7625mm"
            pcbY="0.75mm"
            width="0.375mm"
            height="0.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11", "11"]}
            pcbX="0.25mm"
            pcbY="0.7625mm"
            width="0.35mm"
            height="0.375mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12", "12"]}
            pcbX="-0.25mm"
            pcbY="0.7625mm"
            width="0.35mm"
            height="0.375mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const d1N4001PinLabels = {
  pin1: ["pin1", "1", "cathode", "neg"],
  pin2: ["pin2", "2", "anode", "pos"],
} as const
const D_1N4001 = (props: ChipProps<typeof d1N4001PinLabels>) => {
  return (
    <diode
      manufacturerPartNumber="1N4001"
      pinLabels={d1N4001PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="1.4mm"
            pcbY="0mm"
            width="1.1mm"
            height="1.1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-1.4mm"
            pcbY="0mm"
            width="1.1mm"
            height="1.1mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const evqpuLc02KPinLabels = {
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
} as const
const EVQPU_LC_02K = (props: ChipProps<typeof evqpuLc02KPinLabels>) => {
  return (
    <pushbutton
      manufacturerPartNumber="EVQPUC02K"
      supplierPartNumbers={{ jlcpcb: ["C79174"] }}
      pinLabels={evqpuLc02KPinLabels}
      footprint={
        <footprint>
          <hole pcbX={0} pcbY={1.375} diameter={0.75} />
          <hole pcbX={0} pcbY={-1.375} diameter={0.75} />
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="2.625mm"
            pcbY="-0.85mm"
            width="1.55mm"
            height="1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-2.625mm"
            pcbY="-0.85mm"
            width="1.55mm"
            height="1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="2.625mm"
            pcbY="0.85mm"
            width="1.55mm"
            height="1mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-2.625mm"
            pcbY="0.85mm"
            width="1.55mm"
            height="1mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const PagerMotorSymbol = () => (
  <symbol>
    <schematictext
      text="{NAME}"
      schX={0.2}
      schY={0.2}
      fontSize={0.1}
      anchor="left"
      color="rgb(132, 0, 0)"
    />
    <schematictext
      text="Vibration Motor"
      schX={0.2}
      schY={-0.4}
      fontSize={0.1}
      anchor="left"
      color="rgb(132, 0, 0)"
    />
    <schematiccircle
      center={{ x: 0, y: -0.12 }}
      radius={0.256}
      strokeWidth={0.02}
    />
    <schematicline
      x1={-0.1}
      y1={-0.26}
      x2={-0.1}
      y2={0.04}
      strokeWidth={0.045}
    />
    <schematicline x1={-0.1} y1={0.04} x2={0} y2={-0.16} strokeWidth={0.045} />
    <schematicline x1={0} y1={-0.16} x2={0.1} y2={0.04} strokeWidth={0.045} />
    <schematicline x1={0.1} y1={0.04} x2={0.1} y2={-0.26} strokeWidth={0.045} />
    <schematicline x1={0} y1={0.136} x2={0} y2={0.2} strokeWidth={0.045} />
    <schematicline x1={0} y1={-0.376} x2={0} y2={-0.4} strokeWidth={0.045} />
    <port
      name="pin1"
      pinNumber={1}
      schX={0}
      schY={0.4}
      direction="up"
      schStemLength={0.2}
    />
    <port
      name="pin2"
      pinNumber={2}
      schX={0}
      schY={-0.6}
      direction="down"
      schStemLength={0.2}
    />
  </symbol>
)

const pagerMotorPinLabels = {
  pin1: ["pin1", "1"],
  pin2: ["pin2", "2"],
} as const
const PagerMotor = (props: ChipProps<typeof pagerMotorPinLabels>) => {
  return (
    <chip
      symbol={<PagerMotorSymbol />}
      pinAttributes={{
        pin1: { requiresPower: true, requiresGround: false, isPassive: true },
        pin2: { requiresGround: true, isPassive: true },
      }}
      pinLabels={pagerMotorPinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="0mm"
            pcbY="-1mm"
            width="1.5mm"
            height="1.35mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0mm"
            pcbY="1mm"
            width="1.35mm"
            height="1.5mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const s8050PinLabels = {
  pin1: ["pin1", "1", "base", "B"],
  pin2: ["pin2", "2", "emitter", "E"],
  pin3: ["pin3", "3", "collector", "C"],
} as const
const S8050 = (props: ChipProps<typeof s8050PinLabels>) => {
  return (
    <transistor
      manufacturerPartNumber="S8050"
      supplierPartNumbers={{ jlcpcb: ["C916390"] }}
      type="npn"
      pinLabels={s8050PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="0.9375mm"
            pcbY="-0.95mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="0.9375mm"
            pcbY="0.95mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="-0.9375mm"
            pcbY="0mm"
            width="1.475mm"
            height="0.6mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const SensorsAndButtonsComponents = () => (
  <>
    <PagerMotor
      name="M1"
      pcbX={-14.45}
      pcbY={7.975}
      pcbRotation={270}
      schSectionName={schematicSections.motor}
      schSheetName={schematicSheets.motor}
    />
    <resistor
      name="R4"
      resistance="100kΩ"
      footprint="0402"
      pcbX={15.51}
      pcbY={-17.34}
      pcbRotation={180}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <EVQPU_LC_02K
      name="SW1"
      pcbX={15.14}
      pcbY={13.2}
      pcbRotation={90}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <resistor
      name="R13"
      resistance="1kΩ"
      footprint="0402"
      pcbX={-7.15}
      pcbY={5.8}
      schSectionName={schematicSections.motor}
      schSheetName={schematicSheets.motor}
    />
    <S8050
      name="Q2"
      pcbX={-10.15}
      pcbY={8.4}
      pcbRotation={270}
      schSectionName={schematicSections.motor}
      schSheetName={schematicSheets.motor}
    />
    <resistor
      name="R18"
      resistance="10kΩ"
      footprint="0402"
      pcbX={-7.43}
      pcbY={10.49}
      pcbRotation={90}
      schSectionName={schematicSections.accelerometer}
      schSheetName={schematicSheets.accelerometer}
    />
    <EVQPU_LC_02K
      name="SW2"
      pcbX={14.94}
      pcbY={-13.2}
      pcbRotation={90}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <BMA423
      name="U6"
      pcbX={-5.71}
      pcbY={11}
      schSectionName={schematicSections.accelerometer}
      schSheetName={schematicSheets.accelerometer}
    />
    <EVQPU_LC_02K
      name="SW3"
      pcbX={-14.94}
      pcbY={13.21}
      pcbRotation={270}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <capacitor
      name="C14"
      capacitance="100nF"
      footprint="0402"
      pcbX={-10.09}
      pcbY={11.1}
      pcbRotation={90}
      schSectionName={schematicSections.motor}
      schSheetName={schematicSheets.motor}
    />
    <D_1N4001
      name="D2"
      pcbX={-11.7}
      pcbY={11.68}
      pcbRotation={90}
      schSectionName={schematicSections.motor}
      schSheetName={schematicSheets.motor}
    />
    <resistor
      name="R11"
      resistance="100kΩ"
      footprint="0402"
      pcbX={-15.53}
      pcbY={-17.34}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <resistor
      name="R20"
      resistance="10kΩ"
      footprint="0402"
      pcbX={-5.39}
      pcbY={12.53}
      schSectionName={schematicSections.accelerometer}
      schSheetName={schematicSheets.accelerometer}
    />
    <EVQPU_LC_02K
      name="SW4"
      pcbX={-14.94}
      pcbY={-13.2}
      pcbRotation={270}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <resistor
      name="R7"
      resistance="100kΩ"
      footprint="0402"
      pcbX={6.9}
      pcbY={2.7}
      pcbRotation={270}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
    <resistor
      name="R10"
      resistance="100kΩ"
      footprint="0402"
      pcbX={-10.08}
      pcbY={13.1}
      pcbRotation={90}
      schSectionName={schematicSections.buttons}
      schSheetName={schematicSheets.buttons}
    />
  </>
)
const SensorsAndButtonsTraces = () => (
  <>
    <trace from=".M1 > .pin1" to="net.P3V3" />
    <trace from=".R4 > .pin2" to="net.P3V3" />
    <trace from=".R18 > .pin2" to="net.P3V3" />
    <trace from=".U6 > .pin3" to="net.P3V3" />
    <trace from=".U6 > .pin7" to="net.P3V3" />
    <trace from=".U6 > .pin10" to="net.P3V3" />
    <trace from=".C14 > .pin1" to="net.P3V3" />
    <trace from=".D2 > .pin1" to="net.P3V3" />
    <trace from=".R11 > .pin2" to="net.P3V3" />
    <trace from=".R20 > .pin2" to="net.P3V3" />
    <trace from=".R7 > .pin2" to="net.P3V3" />
    <trace from=".R10 > .pin2" to="net.P3V3" />
    <trace from=".SW1 > .pin2" to="net.GND" />
    <trace from=".Q2 > .pin2" to="net.GND" />
    <trace from=".SW2 > .pin2" to="net.GND" />
    <trace from=".U6 > .pin1" to="net.GND" />
    <trace from=".U6 > .pin8" to="net.GND" />
    <trace from=".U6 > .pin9" to="net.GND" />
    <trace from=".SW3 > .pin2" to="net.GND" />
    <trace from=".SW4 > .pin2" to="net.GND" />
    <trace from=".M1 > .pin2" to="net.MOTOR_LOW" />
    <trace from=".Q2 > .pin3" to="net.MOTOR_LOW" />
    <trace from=".C14 > .pin2" to="net.MOTOR_LOW" />
    <trace from=".D2 > .pin2" to="net.MOTOR_LOW" />
    <trace from=".R4 > .pin1" to="net.BTN1" />
    <trace from=".SW2 > .pin1" to="net.BTN1" />
    <trace from=".SW1 > .pin1" to="net.BTN2" />
    <trace from=".R7 > .pin1" to="net.BTN2" />
    <trace from=".R13 > .pin1" to="net.MOTOR_GATE" />
    <trace from=".Q2 > .pin1" to="net.MOTOR_GATE" />
    <trace from=".R13 > .pin2" to="net.VIB_PWM" />
    <trace from=".SW3 > .pin1" to="net.BTN3" />
    <trace from=".R10 > .pin1" to="net.BTN3" />
    <trace from=".R11 > .pin1" to="net.BTN4" />
    <trace from=".SW4 > .pin1" to="net.BTN4" />
    <trace from=".U6 > .pin12" to="net.SCL" />
    <trace from=".R20 > .pin1" to="net.SCL" />
    <trace from=".R18 > .pin1" to="net.SDA" />
    <trace from=".U6 > .pin2" to="net.SDA" />
    <trace from=".U6 > .pin6" to="net.ACC_INT_2" />
    <trace from=".U6 > .pin5" to="net.ACC_INT_1" />
  </>
)

const U_F_M5DD_Y_L_FOOTPRINT = (
  <footprint insertionDirection="from_y_neg">
    <platedhole
      portHints={["pin6"]}
      pcbX="3.599942mm"
      pcbY="-1.75790855mm"
      holeWidth="0.700024mm"
      holeHeight="1.6000222mm"
      outerWidth="1.2999974mm"
      outerHeight="2.1999956mm"
      shape="pill"
    />
    <platedhole
      portHints={["pin9"]}
      pcbX="-3.599942mm"
      pcbY="-1.75841655mm"
      holeWidth="0.700024mm"
      holeHeight="1.6000222mm"
      outerWidth="1.2999974mm"
      outerHeight="2.1999956mm"
      shape="pill"
    />
    <platedhole
      portHints={["pin8"]}
      pcbX="-2.424938mm"
      pcbY="1.04167945mm"
      outerDiameter="1.2500102mm"
      holeDiameter="0.700024mm"
      shape="circle"
    />
    <platedhole
      portHints={["pin7"]}
      pcbX="2.424938mm"
      pcbY="1.04167945mm"
      outerDiameter="1.2500102mm"
      holeDiameter="0.700024mm"
      shape="circle"
    />
    <smtpad
      portHints={["pin4"]}
      pcbX="0.639572mm"
      pcbY="1.18341145mm"
      width="0.4500118mm"
      height="1.2500102mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin3"]}
      pcbX="-0.010414mm"
      pcbY="1.18341145mm"
      width="0.4500118mm"
      height="1.2500102mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="-0.6604mm"
      pcbY="1.18341145mm"
      width="0.4500118mm"
      height="1.2500102mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-1.310386mm"
      pcbY="1.18341145mm"
      width="0.4500118mm"
      height="1.2500102mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin5"]}
      pcbX="1.289558mm"
      pcbY="1.18341145mm"
      width="0.4500118mm"
      height="1.2500102mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -3.780002600000003, y: -3.9810181500000112 },
        { x: 3.7999923999999794, y: -3.9810181500000112 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 3.7999923999999794, y: -0.4499355499999922 },
        { x: 3.7999923999999794, y: -0.4329937500000085 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -3.780002600000003, y: -3.070910749999996 },
        { x: -3.780002600000003, y: -3.9810181500000112 },
        { x: -4.119981600000017, y: -4.320997150000011 },
        { x: 4.009999599999986, y: -4.320997150000011 },
        { x: 4.180001799999985, y: -4.320997150000011 },
        { x: 3.7999923999999794, y: -3.940987750000005 },
        { x: 3.7999923999999794, y: -3.0660847500000017 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 3.356101999999993, y: 1.2689840500000003 },
        { x: 3.7999923999999794, y: 1.2689840500000003 },
        { x: 3.7999923999999794, y: -0.4329937500000085 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -3.780002600000003, y: 1.2689840500000003 },
        { x: -3.780002600000003, y: -0.44592234999998936 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -3.780002600000003, y: 1.2689840500000003 },
        { x: -3.235782200000017, y: 1.2689840500000003 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0.010922mm"
      pcbY="2.80164745mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <fabricationnotepath
      route={[
        { x: -2.999994000000015, y: -3.8509955499999933 },
        { x: -2.999994000000015, y: 0.14899645000001271 },
        { x: -2.4999949999999984, y: 0.14899645000001271 },
        { x: -2.4999949999999984, y: -3.8509955499999933 },
        { x: -2.999994000000015, y: -3.8509955499999933 },
      ]}
      strokeWidth="0.254mm"
    />
    <fabricationnotepath
      route={[
        { x: 2.9999939999999725, y: -3.8509955499999933 },
        { x: 2.9999939999999725, y: 0.14899645000001271 },
        { x: 2.499994999999984, y: 0.14899645000001271 },
        { x: 2.499994999999984, y: -3.8509955499999933 },
        { x: 2.9999939999999725, y: -3.8509955499999933 },
      ]}
      strokeWidth="0.254mm"
    />
    <fabricationnotepath
      route={[
        { x: -2.4999949999999984, y: 0.14899645000001271 },
        { x: 2.499994999999984, y: 0.14899645000001271 },
        { x: 2.499994999999984, y: -0.351002550000004 },
        { x: -2.4999949999999984, y: -0.351002550000004 },
        { x: -2.4999949999999984, y: 0.14899645000001271 },
      ]}
      strokeWidth="0.254mm"
    />
    <courtyardoutline
      outline={[
        { x: -4.493578000000014, y: 2.05164744999999 },
        { x: 4.515421999999987, y: 2.05164744999999 },
        { x: 4.515421999999987, y: -4.671352550000009 },
        { x: -4.493578000000014, y: -4.671352550000009 },
        { x: -4.493578000000014, y: 2.05164744999999 },
      ]}
    />
  </footprint>
)

const microUsbPinLabels = {
  pin1: ["VBUS", "pin1", "1"],
  pin2: ["D_NEG", "pin2", "2"],
  pin3: ["D_POS", "pin3", "3"],
  pin4: ["ID", "pin4", "4"],
  pin5: ["GND", "pin5", "5"],
  pin6: ["SHIELD1", "pin6"],
  pin7: ["SHIELD2", "pin7"],
  pin8: ["SHIELD3", "pin8"],
  pin9: ["SHIELD4", "pin9"],
} as const
const MicroUSB = (props: ChipProps<typeof microUsbPinLabels>) => (
  <connector
    pinCount={9}
    pinLabels={microUsbPinLabels}
    manufacturerPartNumber="U-F-M5DD-Y-L"
    supplierPartNumbers={{ jlcpcb: ["C91146"] }}
    footprint={U_F_M5DD_Y_L_FOOTPRINT}
    {...props}
  />
)

const usblc62Sc6PinLabels = {
  pin1: ["I_O1_1", "pin1", "1"],
  pin2: ["GND", "pin2", "2"],
  pin3: ["I_O2_3", "pin3", "3"],
  pin4: ["I_O2_4", "pin4", "4"],
  pin5: ["VBUS", "pin5", "5"],
  pin6: ["I_O1_6", "pin6", "6"],
} as const
const USBLC6_2SC6 = (props: ChipProps<typeof usblc62Sc6PinLabels>) => {
  return (
    <chip
      manufacturerPartNumber="USBLC6-2SC6"
      supplierPartNumbers={{ jlcpcb: ["C7519"] }}
      displayName="USBLC6-2SC6"
      pinAttributes={{
        pin1: { isPassive: true },
        pin2: { requiresGround: true },
        pin3: { isPassive: true },
        pin4: { isPassive: true },
        pin5: { requiresPower: true },
        pin6: { isPassive: true },
      }}
      pinLabels={usblc62Sc6PinLabels}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "1"]}
            pcbX="-1.15mm"
            pcbY="0.95mm"
            width="1.2mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "2"]}
            pcbX="-1.15mm"
            pcbY="0mm"
            width="1.2mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3", "3"]}
            pcbX="-1.15mm"
            pcbY="-0.95mm"
            width="1.2mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4", "4"]}
            pcbX="1.15mm"
            pcbY="-0.95mm"
            width="1.2mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5", "5"]}
            pcbX="1.15mm"
            pcbY="0mm"
            width="1.2mm"
            height="0.6mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6", "6"]}
            pcbX="1.15mm"
            pcbY="0.95mm"
            width="1.2mm"
            height="0.6mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const UsbInterfaceComponents = () => (
  <>
    <MicroUSB
      name="J2"
      pcbX={-12}
      pcbY={0}
      pcbRotation={270}
      schSectionName={schematicSections.usb}
      schSheetName={schematicSheets.usb}
      noConnect={["pin4", "pin6", "pin7", "pin8", "pin9"]}
    />
    <resistor
      name="R15"
      resistance="100kΩ"
      footprint="0402"
      pcbX={5.25}
      pcbY={-0.38}
      pcbRotation={270}
      schSectionName={schematicSections.usbProtection}
      schSheetName={schematicSheets.usb}
    />
    <resistor
      name="R14"
      resistance="51kΩ"
      footprint="0402"
      pcbX={6.35}
      pcbY={-0.38}
      pcbRotation={270}
      schSectionName={schematicSections.usbProtection}
      schSheetName={schematicSheets.usb}
    />
    <USBLC6_2SC6
      name="U5"
      pcbX={9.5}
      pcbY={1.65}
      schSectionName={schematicSections.usbProtection}
      schSheetName={schematicSheets.usb}
    />
    <capacitor
      name="C12"
      capacitance="100nF"
      footprint="0402"
      pcbX={10.2}
      pcbY={3.55}
      pcbRotation={180}
      schSectionName={schematicSections.usbProtection}
      schSheetName={schematicSheets.usb}
    />
  </>
)
const UsbInterfaceTraces = () => (
  <>
    <trace from=".J2 > .pin5" to="net.GND" />
    <trace from=".R15 > .pin2" to="net.GND" />
    <trace from=".U5 > .pin2" to="net.GND" />
    <trace from=".C12 > .pin2" to="net.GND" />
    <trace from=".J2 > .pin1" to="net.VBUS" />
    <trace from=".R14 > .pin1" to="net.VBUS" />
    <trace from=".U5 > .pin5" to="net.VBUS" />
    <trace from=".C12 > .pin1" to="net.VBUS" />
    <trace from=".J2 > .pin2" to="net.DN" />
    <trace from=".U5 > .pin4" to="net.DN" />
    <trace from=".J2 > .pin3" to="net.DP" />
    <trace from=".U5 > .pin6" to="net.DP" />
    <trace from=".U5 > .pin3" to="net.USB_DM_MCU" />
    <trace from=".U5 > .pin1" to="net.USB_DP_MCU" />
    <trace from=".R15 > .pin1" to="net.USB_DET" />
    <trace from=".R14 > .pin2" to="net.USB_DET" />
  </>
)

function WatchyEinkSmartwatch({
  routingDisabled = false,
}: {
  routingDisabled?: boolean
} = {}) {
  return (
    <board
      outline={BOARD_OUTLINE}
      layers={BOARD_LAYER_COUNT}
      thickness={BOARD_THICKNESS_MM}
      minViaHoleDiameter="0.2mm"
      minViaEdgeToPadEdgeClearance="0.2mm"
      minTraceToHoleEdgeClearance="0.2032mm"
      title="Watchy E-Ink Smartwatch"
      schAutoLayoutEnabled
      schLayout={{ matchAdapt: true }}
      routingDisabled={routingDisabled}
      autorouter="auto_local"
      routeRemaining
    >
      <cutout shape="polygon" points={TOP_STRAP_CUTOUT} />
      <cutout shape="polygon" points={BOTTOM_STRAP_CUTOUT} />
      <SchematicSheets />
      <McuCoreComponents />
      <EpaperInterfaceComponents />
      <PowerSupplyComponents />
      <UsbInterfaceComponents />
      <SensorsAndButtonsComponents />
      <CrystalRfRouting />
      <McuCoreTraces />
      <EpaperInterfaceTraces />
      <PowerSupplyTraces />
      <UsbInterfaceTraces />
      <SensorsAndButtonsTraces />
      <BoardCopper />
    </board>
  )
}

export default WatchyEinkSmartwatch
