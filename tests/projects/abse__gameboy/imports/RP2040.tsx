import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IOVDD6"],
  pin2: ["GPIO0"],
  pin3: ["GPIO1"],
  pin4: ["GPIO2"],
  pin5: ["GPIO3"],
  pin6: ["GPIO4"],
  pin7: ["GPIO5"],
  pin8: ["GPIO6"],
  pin9: ["GPIO7"],
  pin10: ["IOVDD5"],
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
  pin22: ["IOVDD4"],
  pin23: ["DVDD2"],
  pin24: ["SWCLK"],
  pin25: ["SWD"],
  pin26: ["RUN"],
  pin27: ["GPIO16"],
  pin28: ["GPIO17"],
  pin29: ["GPIO18"],
  pin30: ["GPIO19"],
  pin31: ["GPIO20"],
  pin32: ["GPIO21"],
  pin33: ["IOVDD3"],
  pin34: ["GPIO22"],
  pin35: ["GPIO23"],
  pin36: ["GPIO24"],
  pin37: ["GPIO25"],
  pin38: ["GPIO26_ADC0"],
  pin39: ["GPIO27_ADC1"],
  pin40: ["GPIO28_ADC2"],
  pin41: ["GPIO29_ADC3"],
  pin42: ["IOVDD2"],
  pin43: ["ADC_AVDD"],
  pin44: ["VREG_IN"],
  pin45: ["VREG_VOUT"],
  pin46: ["USB_DM"],
  pin47: ["USB_DP"],
  pin48: ["USB_VDD"],
  pin49: ["IOVDD1"],
  pin50: ["DVDD1"],
  pin51: ["QSPI_SD3"],
  pin52: ["QSPI_SCLK"],
  pin53: ["QSPI_SD0"],
  pin54: ["QSPI_SD2"],
  pin55: ["QSPI_SD1"],
  pin56: ["QSPI_SS"],
  pin57: ["GND"]
} as const

export const RP2040 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2040"
  ]
}}
      manufacturerPartNumber="RP2040"
      footprint={<footprint>
        <smtpad portHints={["pin57"]} pcbX="-0mm" pcbY="0.000127mm" width="3.0999938mm" height="3.0999938mm" shape="rect" />
<smtpad portHints={["pin56"]} pcbX="-2.599944mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin55"]} pcbX="-2.200148mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin54"]} pcbX="-1.800098mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin53"]} pcbX="-1.400048mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin52"]} pcbX="-0.999998mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin51"]} pcbX="-0.599948mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin50"]} pcbX="-0.200152mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin49"]} pcbX="0.199898mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin48"]} pcbX="0.599948mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin47"]} pcbX="0.999998mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin46"]} pcbX="1.400048mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin45"]} pcbX="1.799844mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin44"]} pcbX="2.199894mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin43"]} pcbX="2.599944mm" pcbY="3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin42"]} pcbX="3.424936mm" pcbY="2.600071mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin41"]} pcbX="3.424936mm" pcbY="2.200021mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin40"]} pcbX="3.424936mm" pcbY="1.799971mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin39"]} pcbX="3.424936mm" pcbY="1.399921mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin38"]} pcbX="3.424936mm" pcbY="1.000125mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin37"]} pcbX="3.424936mm" pcbY="0.600075mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin36"]} pcbX="3.424936mm" pcbY="0.200025mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin35"]} pcbX="3.424936mm" pcbY="-0.200025mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin34"]} pcbX="3.424936mm" pcbY="-0.600075mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin33"]} pcbX="3.424936mm" pcbY="-0.999871mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin32"]} pcbX="3.424936mm" pcbY="-1.399921mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin31"]} pcbX="3.424936mm" pcbY="-1.799971mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin30"]} pcbX="3.424936mm" pcbY="-2.200021mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin29"]} pcbX="3.424936mm" pcbY="-2.600071mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin28"]} pcbX="2.599944mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin27"]} pcbX="2.199894mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin26"]} pcbX="1.799844mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin25"]} pcbX="1.400048mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin24"]} pcbX="0.999998mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin23"]} pcbX="0.599948mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin22"]} pcbX="0.199898mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin21"]} pcbX="-0.200152mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="-0.599948mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="-0.999998mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="-1.400048mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="-1.800098mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="-2.200148mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="-2.599944mm" pcbY="-3.425063mm" width="0.1999996mm" height="0.850011mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="-3.424936mm" pcbY="-2.600071mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="-3.424936mm" pcbY="-2.200021mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="-3.424936mm" pcbY="-1.799971mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="-3.424936mm" pcbY="-1.399921mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="-3.424936mm" pcbY="-0.999871mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-3.424936mm" pcbY="-0.600075mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-3.424936mm" pcbY="-0.200025mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-3.424936mm" pcbY="0.200025mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-3.424936mm" pcbY="0.600075mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-3.424936mm" pcbY="1.000125mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-3.424936mm" pcbY="1.399921mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-3.424936mm" pcbY="1.799971mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-3.424936mm" pcbY="2.200021mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-3.424936mm" pcbY="2.600071mm" width="0.850011mm" height="0.1999996mm" shape="rect" />
<silkscreenpath route={[{"x":-3.2409891999999445,"y":3.500018399999931},{"x":-3.2409891999999445,"y":3.403168199999868},{"x":-3.5000691999999844,"y":3.144062800000029}]} />
<silkscreenpath route={[{"x":-3.5000691999999844,"y":2.931185400000004},{"x":-2.9311854000001176,"y":3.500018399999931}]} />
<silkscreenpath route={[{"x":-3.5000691999999844,"y":2.931185400000004},{"x":-3.5000691999999844,"y":3.500018399999931}]} />
<silkscreenpath route={[{"x":-2.9311854000001176,"y":-3.499916799999937},{"x":-3.40004399999998,"y":-3.499916799999937},{"x":-3.5000691999999844,"y":-3.499916799999937},{"x":-3.5000691999999844,"y":-2.9310838000000103}]} />
<silkscreenpath route={[{"x":3.499942199999964,"y":-2.9310838000000103},{"x":3.499942199999964,"y":-3.499916799999937},{"x":2.931083800000124,"y":-3.499916799999937}]} />
<silkscreenpath route={[{"x":2.931083800000124,"y":3.500018399999931},{"x":3.499942199999964,"y":3.500018399999931},{"x":3.499942199999964,"y":2.931185400000004}]} />
<silkscreenpath route={[{"x":-3.5000691999999844,"y":3.500018399999931},{"x":-2.9311854000001176,"y":3.500018399999931}]} />
<silkscreenpath route={[{"x":-3.2409891999999445,"y":3.5001453999999512},{"x":-3.2409891999999445,"y":3.4032952000000023},{"x":-3.5000691999999844,"y":3.144215200000076}]} />
<silkscreenpath route={[{"x":-3.5000691999999844,"y":2.9313124000000244},{"x":-2.9311854000001176,"y":3.5001453999999512}]} />
<silkscreenpath route={[{"x":-3.5000691999999844,"y":2.9313124000000244},{"x":-3.5000691999999844,"y":3.5001453999999512}]} />
<silkscreenpath route={[{"x":-2.9311854000001176,"y":-3.4997898000000305},{"x":-3.40004399999998,"y":-3.4997898000000305},{"x":-3.5000691999999844,"y":-3.4997898000000305},{"x":-3.5000691999999844,"y":-2.93095679999999}]} />
<silkscreenpath route={[{"x":3.499916800000051,"y":-2.93095679999999},{"x":3.499916800000051,"y":-3.4997898000000305},{"x":2.931083800000124,"y":-3.4997898000000305}]} />
<silkscreenpath route={[{"x":2.931083800000124,"y":3.5001453999999512},{"x":3.499916800000051,"y":3.5001453999999512},{"x":3.499916800000051,"y":2.9313124000000244}]} />
<silkscreenpath route={[{"x":-3.5000691999999844,"y":3.5001453999999512},{"x":-2.9311854000001176,"y":3.5001453999999512}]} />
<silkscreentext text="{NAME}" pcbX="-0.140208mm" pcbY="4.859022mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.3780080000000225,"y":4.109021999999982},{"x":4.097592000000077,"y":4.109021999999982},{"x":4.097592000000077,"y":-4.087178000000108},{"x":-4.3780080000000225,"y":-4.087178000000108},{"x":-4.3780080000000225,"y":4.109021999999982}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2040.obj?uuid=76b360a9d4c54384a4e47d7e5af156df",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2040.step?uuid=76b360a9d4c54384a4e47d7e5af156df",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.02 },
      }}
      {...props}
    />
  )
}