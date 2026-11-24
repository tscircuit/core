import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["PC13"],
  pin2: ["PC14_OSC32_IN"],
  pin3: ["PC15_OSC32_OUT"],
  pin4: ["VBAT"],
  pin5: ["VREF_POS"],
  pin6: ["VDDA", "DDA"],
  pin7: ["VSSA", "SSA"],
  pin8: ["PF0_OSC_IN"],
  pin9: ["PF1_OSC_OUT"],
  pin10: ["NRST"],
  pin11: ["PA0"],
  pin12: ["PA1"],
  pin13: ["PA2"],
  pin14: ["PA3"],
  pin15: ["PA4"],
  pin16: ["PA5"],
  pin17: ["PA6"],
  pin18: ["PA7"],
  pin19: ["PB0"],
  pin20: ["PB1"],
  pin21: ["PB2"],
  pin22: ["PB10"],
  pin23: ["PB11"],
  pin24: ["PB12"],
  pin25: ["PB13"],
  pin26: ["PB14"],
  pin27: ["PB15"],
  pin28: ["PA8"],
  pin29: ["PA9"],
  pin30: ["PC6"],
  pin31: ["PC7"],
  pin32: ["PA10"],
  pin33: ["PA11_PA9_"],
  pin34: ["PA12_PA10_"],
  pin35: ["PA13"],
  pin36: ["PA14_BOOT0"],
  pin37: ["PA15"],
  pin38: ["PD0"],
  pin39: ["PD1"],
  pin40: ["PD2"],
  pin41: ["PD3"],
  pin42: ["PB3"],
  pin43: ["PB4"],
  pin44: ["PB5"],
  pin45: ["PB6"],
  pin46: ["PB7"],
  pin47: ["PB8"],
  pin48: ["PB9"],
} as const

export const STM32G030C8T6 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C529329"],
      }}
      manufacturerPartNumber="STM32G030C8T6"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.750058mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-2.249932mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.75006mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.249934mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.750062mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.249936mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.249936mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.750062mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.249934mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.75006mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="2.249932mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="2.750058mm"
            pcbY="-4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="4.109974mm"
            pcbY="-2.750058mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="4.109974mm"
            pcbY="-2.249932mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="4.109974mm"
            pcbY="-1.75006mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="4.109974mm"
            pcbY="-1.249934mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="4.109974mm"
            pcbY="-0.750062mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="4.109974mm"
            pcbY="-0.249936mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="4.109974mm"
            pcbY="0.249936mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="4.109974mm"
            pcbY="0.750062mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="4.109974mm"
            pcbY="1.249934mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="4.109974mm"
            pcbY="1.75006mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="4.109974mm"
            pcbY="2.249932mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="4.109974mm"
            pcbY="2.750058mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="2.750058mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="2.249932mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="1.75006mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="1.249934mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="0.750062mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="0.249936mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="-0.249936mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="-0.750062mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="-1.249934mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="-1.75006mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="-2.249932mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="-2.750058mm"
            pcbY="4.109974mm"
            width="0.2800096mm"
            height="1.6199866mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="-4.109974mm"
            pcbY="2.750058mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="-4.109974mm"
            pcbY="2.249932mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="-4.109974mm"
            pcbY="1.75006mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="-4.109974mm"
            pcbY="1.249934mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-4.109974mm"
            pcbY="0.750062mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="-4.109974mm"
            pcbY="0.249936mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="-4.109974mm"
            pcbY="-0.249936mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="-4.109974mm"
            pcbY="-0.750062mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="-4.109974mm"
            pcbY="-1.249934mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="-4.109974mm"
            pcbY="-1.75006mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin47"]}
            pcbX="-4.109974mm"
            pcbY="-2.249932mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin48"]}
            pcbX="-4.109974mm"
            pcbY="-2.750058mm"
            width="1.6199866mm"
            height="0.2800096mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -3.042386599999986, y: -3.5761930000000035 },
              { x: -3.5761929999999893, y: -3.5761930000000035 },
              { x: -3.5761929999999893, y: -3.0423866000000004 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.042386599999986, y: 3.5761929999999893 },
              { x: -3.5761929999999893, y: 3.5761929999999893 },
              { x: -3.5761929999999893, y: 3.042386599999986 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.0423866000000004, y: 3.5761929999999893 },
              { x: 3.5761930000000035, y: 3.5761929999999893 },
              { x: 3.5761930000000035, y: 3.042386599999986 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.0423866000000004, y: -3.5761930000000035 },
              { x: 3.5761930000000035, y: -3.5761930000000035 },
              { x: 3.5761930000000035, y: -3.0423866000000004 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.995193399999991, y: -2.995193400000005 },
              { x: -2.995193399999991, y: 2.995193399999991 },
              { x: 2.995193400000005, y: 2.995193399999991 },
              { x: 2.995193400000005, y: -2.995193400000005 },
              { x: -2.995193399999991, y: -2.995193400000005 },
            ]}
          />
          <silkscreencircle
            pcbX="-2.667762mm"
            pcbY="-2.667762mm"
            radius="0.087376mm"
          />
          <silkscreencircle pcbX="-3.81mm" pcbY="-3.81mm" radius="0.087376mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0127mm"
            pcbY="5.9276mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -5.169967299999996, y: 5.169967299999996 },
              { x: 5.169967299999996, y: 5.169967299999996 },
              { x: 5.169967299999996, y: -5.16996730000001 },
              { x: -5.169967299999996, y: -5.16996730000001 },
              { x: -5.169967299999996, y: 5.169967299999996 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C529329.obj?uuid=6c74d516f6f64dbba6d7afeba13c6fce",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C529329.step?uuid=6c74d516f6f64dbba6d7afeba13c6fce",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.8 },
      }}
      {...props}
    />
  )
}
