import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IOVDD1"],
  pin2: ["GPIO0"],
  pin3: ["GPIO1"],
  pin4: ["GPIO2"],
  pin5: ["GPIO3"],
  pin6: ["GPIO4"],
  pin7: ["GPIO5"],
  pin8: ["GPIO6"],
  pin9: ["GPIO7"],
  pin10: ["IOVDD2"],
  pin11: ["GPIO8"],
  pin12: ["GPIO9"],
  pin13: ["GPIO10"],
  pin14: ["GPIO11"],
  pin15: ["GPIO12"],
  pin16: ["GPIO13"],
  pin17: ["GPIO14"],
  pin18: ["GPIO15"],
  pin19: ["TESTEN"],
  pin20: ["XIN"],
  pin21: ["XOUT"],
  pin22: ["IOVDD3"],
  pin23: ["DVDD1"],
  pin24: ["SWCLK"],
  pin25: ["SWD"],
  pin26: ["RUN"],
  pin27: ["GPIO16"],
  pin28: ["GPIO17"],
  pin29: ["GPIO18"],
  pin30: ["GPIO19"],
  pin31: ["GPIO20"],
  pin32: ["GPIO21"],
  pin33: ["IOVDD4"],
  pin34: ["GPIO22"],
  pin35: ["GPIO23"],
  pin36: ["GPIO24"],
  pin37: ["GPIO25"],
  pin38: ["GPIO26_ADC0"],
  pin39: ["GPIO27_ADC1"],
  pin40: ["GPIO28_ADC2"],
  pin41: ["GPIO29_ADC3"],
  pin42: ["IOVDD5"],
  pin43: ["ADC_AVDD"],
  pin44: ["VREG_VIN"],
  pin45: ["VREG_VOUT"],
  pin46: ["USB_DM"],
  pin47: ["USB_DP"],
  pin48: ["USB_VDD"],
  pin49: ["IOVDD6"],
  pin50: ["DVDD2"],
  pin51: ["QSPI_SD3"],
  pin52: ["QSPI_SCLK"],
  pin53: ["QSPI_SD0"],
  pin54: ["QSPI_SD2"],
  pin55: ["QSPI_SD1"],
  pin56: ["QSPI_SS_N"],
  pin57: ["GND"],
} as const

export const RP2040 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2040"],
      }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [
            // Top on ref
            "QSPI_SS_N",
            "QSPI_SD1",
            "QSPI_SD2",
            "QSPI_SD0",
            "QSPI_SCLK",
            "QSPI_SD3",
            "DVDD1",
            "DVDD2",
            "VREG_VIN",
            "VREG_VOUT",
            "IOVDD1",
            "IOVDD2",
            "IOVDD3",
            "IOVDD4",
            "IOVDD5",
            "IOVDD6",
            "GND",
            "USB_VDD",
            "USB_DP",
            "USB_DM",
            "ADC_AVDD",

            "GPIO0",
            "GPIO1",
            "GPIO2",
            "GPIO3",
            "GPIO4",
            "GPIO5",
            "GPIO6",
            "GPIO7",
            "GPIO8",
            "GPIO9",
            "GPIO10",
            "GPIO11",
          ],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [
            "GPIO29_ADC3",
            "GPIO28_ADC2",
            "GPIO27_ADC1",
            "GPIO26_ADC0",
            "GPIO25",
            "GPIO24",
            "GPIO23",
            "GPIO22",
            "GPIO21",
            "GPIO20",
            "GPIO19",
            "GPIO18",
            "GPIO17",
            "GPIO16",

            "GPIO12",
            "GPIO13",
            "GPIO14",
            "GPIO15",
            "TESTEN",
            "XIN",
            "XOUT",
            "SWCLK",
            "SWD",
            "RUN",
          ],
        },
      }}
      schWidth={3}
      schPinStyle={{
        IOVDD1: {
          marginTop: 0.4,
        },
        GND: {
          marginTop: 0.4,
          marginBottom: 0.4,
        },
        GPIO25: {
          marginTop: 0.4,
        },
        GPIO12: {
          marginTop: 0.4,
        },
        XIN: {
          marginTop: 0.4,
        },
        XOUT: {
          marginBottom: 0.4,
        },
        VREG_VIN: {
          marginTop: 0.4,
        },
      }}
      manufacturerPartNumber="RP2040"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-3.5501580000000104mm"
            pcbY="2.6000710000001845mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-3.5501580000000104mm"
            pcbY="2.200021000000106mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-3.5501580000000104mm"
            pcbY="1.7999710000001414mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-3.5501580000000104mm"
            pcbY="1.399921000000063mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-3.5501580000000104mm"
            pcbY="1.0001250000001392mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-3.5501580000000104mm"
            pcbY="0.6000750000000608mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.5501580000000104mm"
            pcbY="0.20002500000009604mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-0.20002499999998236mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-0.6000749999999471mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-0.9998709999999846mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-1.3999209999999493mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-1.799970999999914mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-2.2000209999998788mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-3.5501580000000104mm"
            pcbY="-2.6000709999998435mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-2.5999439999999368mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-2.200148000000013mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-1.8000979999999345mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-1.4000480000001971mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-0.999998000000005mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-0.5999480000000403mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-0.20015200000000277mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="0.19989799999996194mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="0.5999479999999267mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="0.999998000000005mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="1.4000479999999698mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="1.799844000000121mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="2.1998939999998584mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="2.5999439999999368mm"
            pcbY="-3.55003099999999mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="3.5501580000000104mm"
            pcbY="-2.6000709999998435mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="3.5501580000000104mm"
            pcbY="-2.2000209999998788mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="3.5501580000000104mm"
            pcbY="-1.799970999999914mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="3.5501580000000104mm"
            pcbY="-1.3999209999999493mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="3.5501580000000104mm"
            pcbY="-0.9998709999999846mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="3.5501580000000104mm"
            pcbY="-0.6000749999999471mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="3.5501580000000104mm"
            pcbY="-0.20002499999998236mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="3.5501580000000104mm"
            pcbY="0.20002500000009604mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="3.5501580000000104mm"
            pcbY="0.6000750000000608mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="3.5501580000000104mm"
            pcbY="1.0001250000001392mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="3.5501580000000104mm"
            pcbY="1.399921000000063mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="3.5501580000000104mm"
            pcbY="1.7999710000001414mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="3.5501580000000104mm"
            pcbY="2.200021000000106mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="3.5501580000000104mm"
            pcbY="2.6000710000001845mm"
            width="1.0999978mm"
            height="0.19999959999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="2.5999439999999368mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="2.1998939999998584mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="1.799844000000121mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="1.4000479999999698mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin47"]}
            pcbX="0.999998000000005mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin48"]}
            pcbX="0.5999479999999267mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin49"]}
            pcbX="0.19989799999996194mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin50"]}
            pcbX="-0.20015200000000277mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin51"]}
            pcbX="-0.5999480000000403mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin52"]}
            pcbX="-0.999998000000005mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin53"]}
            pcbX="-1.4000480000001971mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin54"]}
            pcbX="-1.8000979999999345mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin55"]}
            pcbX="-2.200148000000013mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin56"]}
            pcbX="-2.5999439999999368mm"
            pcbY="3.5500310000001036mm"
            width="0.19999959999999997mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin57"]}
            pcbX="-1.1368683772161603e-13mm"
            pcbY="0.00012700000002041634mm"
            width="3.0999938mm"
            height="3.0999938mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -3.2409891999999445, y: 3.5000184000000445 },
              { x: -3.2409891999999445, y: 3.4031682000000956 },
              { x: -3.5000691999999844, y: 3.1440882000001693 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.5000691999999844, y: 2.9311854000001176 },
              { x: -2.9311854000001176, y: 3.5000184000000445 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.5000691999999844, y: 2.9311854000001176 },
              { x: -3.5000691999999844, y: 3.5000184000000445 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.9311854000001176, y: -3.499916799999937 },
              { x: -3.40004399999998, y: -3.499916799999937 },
              { x: -3.5000691999999844, y: -3.499916799999937 },
              { x: -3.5000691999999844, y: -2.9310837999998967 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.499916800000051, y: -2.9310837999998967 },
              { x: 3.499916800000051, y: -3.499916799999937 },
              { x: 2.931083800000124, y: -3.499916799999937 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.931083800000124, y: 3.5000184000000445 },
              { x: 3.499916800000051, y: 3.5000184000000445 },
              { x: 3.499916800000051, y: 2.9311854000001176 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.5000691999999844, y: 3.5000184000000445 },
              { x: -2.9311854000001176, y: 3.5000184000000445 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=76b360a9d4c54384a4e47d7e5af156df&pn=C2040",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
