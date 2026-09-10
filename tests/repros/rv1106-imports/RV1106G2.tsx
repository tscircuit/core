import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["MIPI_AVDD1V8"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"],
  pin9: ["pin9"],
  pin10: ["DVDD_1"],
  pin11: ["pin11"],
  pin12: ["pin12"],
  pin13: ["GPIO4_VCC"],
  pin14: ["pin14"],
  pin15: ["pin15"],
  pin16: ["pin16"],
  pin17: ["pin17"],
  pin18: ["pin18"],
  pin19: ["RTC_AVDD3V3"],
  pin20: ["RTC_XOUT"],
  pin21: ["RTC_XIN"],
  pin22: ["pin22"],
  pin23: ["SARADC_IN0_RECOVERY"],
  pin24: ["SARADC_USB_AVDD1V8"],
  pin25: ["USB_VBUSDET"],
  pin26: ["USB_DM"],
  pin27: ["USB_DP"],
  pin28: ["USB_AVDD3V3"],
  pin29: ["CODEC_LINEOUT"],
  pin30: ["CODEC_VCM"],
  pin31: ["CODEC_AVDD1V8"],
  pin32: ["CODEC_MICBIAS"],
  pin33: ["CODEC_MIC0N"],
  pin34: ["CODEC_MIC0P"],
  pin35: ["CODEC_MIC1N"],
  pin36: ["CODEC_MIC1P"],
  pin37: ["CODEC_AVSS"],
  pin38: ["pin38"],
  pin39: ["FSPI_D3"],
  pin40: ["pin40"],
  pin41: ["FSPI_D0"],
  pin42: ["FSPI_D1"],
  pin43: ["GPIO3_VCC"],
  pin44: ["FSPI_D2"],
  pin45: ["pin45"],
  pin46: ["pin46"],
  pin47: ["FSPI_CS0"],
  pin48: ["FSPI_CLK"],
  pin49: ["DDR_VDDQ_1"],
  pin50: ["DDR_VDDQ_2"],
  pin51: ["DVDD_2D"],
  pin52: ["RAM_ZQ"],
  pin53: ["DDR_PLL_AVDD1V8"],
  pin54: ["DVDD_3"],
  pin55: ["DVDD_4"],
  pin56: ["DDR_VDDQ_3"],
  pin57: ["TVSS"],
  pin58: ["pin58"],
  pin59: ["pin59"],
  pin60: ["pin60"],
  pin61: ["PMU_VCC3V3"],
  pin62: ["pin62"],
  pin63: ["pin63"],
  pin64: ["pin64"],
  pin65: ["pin65"],
  pin66: ["POR"],
  pin67: ["PMU_DVDD0V9"],
  pin68: ["OSC_XIN"],
  pin69: ["OSC_XOUT"],
  pin70: ["OSC_PLL_AVDD1V8"],
  pin71: ["OSC_PLL_DVDD"],
  pin72: ["pin72"],
  pin73: ["pin73"],
  pin74: ["pin74"],
  pin75: ["pin75"],
  pin76: ["pin76"],
  pin77: ["pin77"],
  pin78: ["pin78"],
  pin79: ["UART2_TX_M1"],
  pin80: ["UART2_RX_M1"],
  pin81: ["GPIO1_VCC3V3"],
  pin82: ["DVDD_5"],
  pin83: ["pin83"],
  pin84: ["pin84"],
  pin85: ["pin85"],
  pin86: ["pin86"],
  pin87: ["pin87"],
  pin88: ["GPIO6_VCC"],
  pin89: ["pin89"],
  pin90: ["pin90"],
  pin91: ["pin91"],
  pin92: ["pin92"],
  pin93: ["pin93"],
  pin94: ["pin94"],
  pin95: ["pin95"],
  pin96: ["OTP_ETH_TSADC_AVDD1V8"],
  pin97: ["ETH_PHY_RXN"],
  pin98: ["ETH_PHY_RXP"],
  pin99: ["ETH_PHY_TXN"],
  pin100: ["ETH_PHY_TXP"],
  pin101: ["ETH_AVDD3V3"],
  pin102: ["ETH_EXTR"],
  pin103: ["DVDD_6"],
  pin104: ["pin104"],
  pin105: ["pin105"],
  pin106: ["pin106"],
  pin107: ["pin107"],
  pin108: ["GPIO5_VCC"],
  pin109: ["pin109"],
  pin110: ["pin110"],
  pin111: ["pin111"],
  pin112: ["pin112"],
  pin113: ["pin113"],
  pin114: ["pin114"],
  pin115: ["CPU_DVDD"],
  pin116: ["DVDD_7"],
  pin117: ["pin117"],
  pin118: ["pin118"],
  pin119: ["pin119"],
  pin120: ["pin120"],
  pin121: ["pin121"],
  pin122: ["pin122"],
  pin123: ["pin123"],
  pin124: ["pin124"],
  pin125: ["pin125"],
  pin126: ["pin126"],
  pin127: ["pin127"],
  pin128: ["pin128"],
  pin129: ["VSS"]
} as const

const pinAttributes = {
  pin129: {requiresGround: true}
} as const

export const RV1106G2 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C5272606"
  ]
}}
      manufacturerPartNumber="RV1106G2"
      footprint={<footprint>
        <smtpad portHints={["pin129"]} pcbX="-0mm" pcbY="0mm" width="6.999986mm" height="6.999986mm" shape="rect" />
<smtpad portHints={["pin128"]} pcbX="-5.424932mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin127"]} pcbX="-5.07492mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin126"]} pcbX="-4.724908mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin125"]} pcbX="-4.374896mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin124"]} pcbX="-4.024884mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin123"]} pcbX="-3.674872mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin122"]} pcbX="-3.325114mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin121"]} pcbX="-2.975102mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin120"]} pcbX="-2.62509mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin119"]} pcbX="-2.275078mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin118"]} pcbX="-1.925066mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin117"]} pcbX="-1.575054mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin116"]} pcbX="-1.225042mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin115"]} pcbX="-0.87503mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin114"]} pcbX="-0.525018mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin113"]} pcbX="-0.175006mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin112"]} pcbX="0.175006mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin111"]} pcbX="0.525018mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin110"]} pcbX="0.87503mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin109"]} pcbX="1.225042mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin108"]} pcbX="1.575054mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin107"]} pcbX="1.925066mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin106"]} pcbX="2.275078mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin105"]} pcbX="2.62509mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin104"]} pcbX="2.975102mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin103"]} pcbX="3.325114mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin102"]} pcbX="3.674872mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin101"]} pcbX="4.024884mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin100"]} pcbX="4.374896mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin99"]} pcbX="4.724908mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin98"]} pcbX="5.07492mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin97"]} pcbX="5.424932mm" pcbY="6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin96"]} pcbX="6.057392mm" pcbY="5.424932mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin95"]} pcbX="6.057392mm" pcbY="5.07492mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin94"]} pcbX="6.057392mm" pcbY="4.724908mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin93"]} pcbX="6.057392mm" pcbY="4.374896mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin92"]} pcbX="6.057392mm" pcbY="4.024884mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin91"]} pcbX="6.057392mm" pcbY="3.674872mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin90"]} pcbX="6.057392mm" pcbY="3.325114mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin89"]} pcbX="6.057392mm" pcbY="2.975102mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin88"]} pcbX="6.057392mm" pcbY="2.62509mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin87"]} pcbX="6.057392mm" pcbY="2.275078mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin86"]} pcbX="6.057392mm" pcbY="1.925066mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin85"]} pcbX="6.057392mm" pcbY="1.575054mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin84"]} pcbX="6.057392mm" pcbY="1.225042mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin83"]} pcbX="6.057392mm" pcbY="0.87503mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin82"]} pcbX="6.057392mm" pcbY="0.525018mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin81"]} pcbX="6.057392mm" pcbY="0.175006mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin80"]} pcbX="6.057392mm" pcbY="-0.175006mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin79"]} pcbX="6.057392mm" pcbY="-0.525018mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin78"]} pcbX="6.057392mm" pcbY="-0.87503mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin77"]} pcbX="6.057392mm" pcbY="-1.225042mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin76"]} pcbX="6.057392mm" pcbY="-1.575054mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin75"]} pcbX="6.057392mm" pcbY="-1.925066mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin74"]} pcbX="6.057392mm" pcbY="-2.275078mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin73"]} pcbX="6.057392mm" pcbY="-2.62509mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin72"]} pcbX="6.057392mm" pcbY="-2.975102mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin71"]} pcbX="6.057392mm" pcbY="-3.325114mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin70"]} pcbX="6.057392mm" pcbY="-3.674872mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin69"]} pcbX="6.057392mm" pcbY="-4.024884mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin68"]} pcbX="6.057392mm" pcbY="-4.374896mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin67"]} pcbX="6.057392mm" pcbY="-4.724908mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin66"]} pcbX="6.057392mm" pcbY="-5.07492mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin65"]} pcbX="6.057392mm" pcbY="-5.424932mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin64"]} pcbX="5.424932mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin63"]} pcbX="5.07492mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin62"]} pcbX="4.724908mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin61"]} pcbX="4.374896mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin60"]} pcbX="4.024884mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin59"]} pcbX="3.674872mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin58"]} pcbX="3.325114mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin57"]} pcbX="2.975102mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin56"]} pcbX="2.62509mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin55"]} pcbX="2.275078mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin54"]} pcbX="1.925066mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin53"]} pcbX="1.575054mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin52"]} pcbX="1.225042mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin51"]} pcbX="0.87503mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin50"]} pcbX="0.525018mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin49"]} pcbX="0.175006mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin48"]} pcbX="-0.175006mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin47"]} pcbX="-0.525018mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin46"]} pcbX="-0.87503mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin45"]} pcbX="-1.225042mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin44"]} pcbX="-1.575054mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin43"]} pcbX="-1.925066mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin42"]} pcbX="-2.275078mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin41"]} pcbX="-2.62509mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin40"]} pcbX="-2.975102mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin39"]} pcbX="-3.325114mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin38"]} pcbX="-3.674872mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin37"]} pcbX="-4.024884mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin36"]} pcbX="-4.374896mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin35"]} pcbX="-4.724908mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin34"]} pcbX="-5.07492mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin33"]} pcbX="-5.424932mm" pcbY="-6.057392mm" width="0.1960118mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin32"]} pcbX="-6.057392mm" pcbY="-5.424932mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin31"]} pcbX="-6.057392mm" pcbY="-5.07492mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin30"]} pcbX="-6.057392mm" pcbY="-4.724908mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin29"]} pcbX="-6.057392mm" pcbY="-4.374896mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin28"]} pcbX="-6.057392mm" pcbY="-4.024884mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin27"]} pcbX="-6.057392mm" pcbY="-3.674872mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin26"]} pcbX="-6.057392mm" pcbY="-3.325114mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin25"]} pcbX="-6.057392mm" pcbY="-2.975102mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin24"]} pcbX="-6.057392mm" pcbY="-2.62509mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin23"]} pcbX="-6.057392mm" pcbY="-2.275078mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin22"]} pcbX="-6.057392mm" pcbY="-1.925066mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin21"]} pcbX="-6.057392mm" pcbY="-1.575054mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="-6.057392mm" pcbY="-1.225042mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="-6.057392mm" pcbY="-0.87503mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="-6.057392mm" pcbY="-0.525018mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="-6.057392mm" pcbY="-0.175006mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="-6.057392mm" pcbY="0.175006mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="-6.057392mm" pcbY="0.525018mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="-6.057392mm" pcbY="0.87503mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="-6.057392mm" pcbY="1.225042mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="-6.057392mm" pcbY="1.575054mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="-6.057392mm" pcbY="1.925066mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="-6.057392mm" pcbY="2.275078mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-6.057392mm" pcbY="2.62509mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-6.057392mm" pcbY="2.975102mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-6.057392mm" pcbY="3.325114mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-6.057392mm" pcbY="3.674872mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-6.057392mm" pcbY="4.024884mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-6.057392mm" pcbY="4.374896mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-6.057392mm" pcbY="4.724908mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-6.057392mm" pcbY="5.07492mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-6.057392mm" pcbY="5.424932mm" width="0.6649974mm" height="0.1960118mm" shape="rect" />
<silkscreenpath route={[{"x":-6.226302000000032,"y":5.675376000000028},{"x":-6.226302000000032,"y":6.226175000000012},{"x":-5.675502999999935,"y":6.226175000000012}]} />
<silkscreenpath route={[{"x":6.226073399999905,"y":5.675376000000028},{"x":6.226073399999905,"y":6.226175000000012},{"x":5.675274400000035,"y":6.226175000000012}]} />
<silkscreenpath route={[{"x":6.226073399999905,"y":-5.6754013999999415},{"x":6.226073399999905,"y":-6.226174999999898},{"x":5.675274400000035,"y":-6.226174999999898}]} />
<silkscreenpath route={[{"x":-6.226302000000032,"y":-5.6754013999999415},{"x":-6.226302000000032,"y":-6.226174999999898},{"x":-5.675502999999935,"y":-6.226174999999898}]} />
<silkscreencircle pcbX="-6.5532mm" pcbY="5.424932mm" radius="0.124968mm" />
<silkscreentext text="{NAME}" pcbX="-0.155702mm" pcbY="7.386576mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-6.346113800000126,"y":5.461000000000013},{"x":-6.273788325143869,"y":5.639412078815553},{"x":-6.096114299999954,"y":5.713532150117203},{"x":-5.918440274856266,"y":5.639412078815553},{"x":-5.846114800000009,"y":5.461000000000013},{"x":-5.918440274856266,"y":5.2825879211843585},{"x":-6.096114299999954,"y":5.2084678498828225},{"x":-6.273788325143869,"y":5.2825879211843585},{"x":-6.346113800000126,"y":5.461000000000013}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-6.9335020000000895,"y":6.636576000000105},{"x":6.6220979999998235,"y":6.636576000000105},{"x":6.6220979999998235,"y":-6.639624000000026},{"x":-6.9335020000000895,"y":-6.639624000000026},{"x":-6.9335020000000895,"y":6.636576000000105}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C5272606.obj?uuid=c1bbd866bce7425ca9a8837b53ffc2ad",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C5272606.step?uuid=c1bbd866bce7425ca9a8837b53ffc2ad",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.00012700000002041634, y: 0, z: -0.02 },
      }}
      {...props}
    />
  )
}