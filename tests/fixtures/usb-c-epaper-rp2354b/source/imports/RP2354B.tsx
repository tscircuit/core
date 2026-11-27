import { ReferenceLabel } from "../product/reference-label"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GPIO4"],
  pin2: ["GPIO5"],
  pin3: ["GPIO6"],
  pin4: ["GPIO7"],
  pin5: ["IOVDD1"],
  pin6: ["GPIO8"],
  pin7: ["GPIO9"],
  pin8: ["GPIO10"],
  pin9: ["GPIO11"],
  pin10: ["DVDD1"],
  pin11: ["GPIO12"],
  pin12: ["GPIO13"],
  pin13: ["GPIO14"],
  pin14: ["GPIO15"],
  pin15: ["IOVDD2"],
  pin16: ["GPIO16"],
  pin17: ["GPIO17"],
  pin18: ["GPIO18"],
  pin19: ["GPIO19"],
  pin20: ["GPIO20"],
  pin21: ["GPIO21"],
  pin22: ["GPIO22"],
  pin23: ["GPIO23"],
  pin24: ["IOVDD3"],
  pin25: ["GPIO24"],
  pin26: ["GPIO25"],
  pin27: ["GPIO26"],
  pin28: ["GPIO27"],
  pin29: ["IOVDD4"],
  pin30: ["XIN"],
  pin31: ["XOUT"],
  pin32: ["DVDD2"],
  pin33: ["SWCLK"],
  pin34: ["SWDIO"],
  pin35: ["RUN"],
  pin36: ["GPIO28"],
  pin37: ["GPIO29"],
  pin38: ["GPIO30"],
  pin39: ["GPIO31"],
  pin40: ["GPIO32"],
  pin41: ["IOVDD5"],
  pin42: ["GPIO33"],
  pin43: ["GPIO34"],
  pin44: ["GPIO35"],
  pin45: ["GPIO36"],
  pin46: ["GPIO37"],
  pin47: ["GPIO38"],
  pin48: ["GPIO39"],
  pin49: ["GPIO40_ADC0"],
  pin50: ["IOVDD6"],
  pin51: ["DVDD3"],
  pin52: ["GPIO41_ADC1"],
  pin53: ["GPIO42_ADC2"],
  pin54: ["GPIO43_ADC3"],
  pin55: ["GPIO44_ADC4"],
  pin56: ["GPIO45_ADC5"],
  pin57: ["GPIO46_ADC6"],
  pin58: ["GPIO47_ADC7"],
  pin59: ["ADC_AVDD"],
  pin60: ["IOVDD7"],
  pin61: ["VREG_AVDD"],
  pin62: ["VREG_PGND"],
  pin63: ["VREG_LX"],
  pin64: ["VREG_VIN"],
  pin65: ["VREG_FB"],
  pin66: ["USB_DM"],
  pin67: ["USB_DP"],
  pin68: ["USB_OTP_VDD"],
  pin69: ["QSPI_IOVDD"],
  pin70: ["QSPI_SD3"],
  pin71: ["QSPI_SCLK"],
  pin72: ["QSPI_SD0"],
  pin73: ["QSPI_SD2"],
  pin74: ["QSPI_SD1"],
  pin75: ["QSPI_SS"],
  pin76: ["IOVDD8"],
  pin77: ["GPIO0"],
  pin78: ["GPIO1"],
  pin79: ["GPIO2"],
  pin80: ["GPIO3"],
  pin81: ["GND"]
} as const

const pinAttributes = {
  pin81: {isPassive: true, capabilities: [], requiresGround: true, mustBeConnected: true},
  pin1: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin2: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin3: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin4: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin5: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin6: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda","spi_cs"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin7: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin8: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin9: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin10: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin11: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin12: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin13: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin14: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin15: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin16: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin17: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin18: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin19: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx","spi_cs"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin20: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin21: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin22: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin23: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin24: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin25: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin26: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin27: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin28: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin29: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin30: {isInput: true, capabilities: []},
  pin31: {isOutput: true, capabilities: []},
  pin32: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true},
  pin33: {isInput: true, capabilities: [], canUseInternalPullup: true, canUseInternalPulldown: true},
  pin34: {isBidirectional: true, canUseTriState: true, capabilities: [], canUseInternalPullup: true, canUseInternalPulldown: true, canUsePushPull: true},
  pin35: {isInput: true, capabilities: [], canUseInternalPullup: true},
  pin36: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin37: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin38: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin39: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin40: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin41: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin42: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin43: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin44: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin45: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin46: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin47: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin48: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin49: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin50: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin51: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin52: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin53: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin54: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin55: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin56: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin57: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin58: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx","spi_cs"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin59: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin60: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin61: {isInput: true, capabilities: [], requiresPower: true, requiresVoltage: 3.3, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "4.7uF"},
  pin62: {isPassive: true, capabilities: [], requiresGround: true, mustBeConnected: true},
  pin63: {isOutput: true, capabilities: [], providesPower: true},
  pin64: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "4.7uF"},
  pin65: {isInput: true, capabilities: [], mustBeConnected: true},
  pin66: {isBidirectional: true, capabilities: []},
  pin67: {isBidirectional: true, capabilities: []},
  pin68: {isInput: true, capabilities: [], requiresPower: true, requiresVoltage: 3.3, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin69: {isInput: true, capabilities: [], requiresPower: true, requiresVoltage: 3.3, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin70: {isBidirectional: true, capabilities: []},
  pin71: {isBidirectional: true, capabilities: []},
  pin72: {isBidirectional: true, capabilities: []},
  pin73: {isBidirectional: true, capabilities: []},
  pin74: {isBidirectional: true, capabilities: []},
  pin75: {isBidirectional: true, capabilities: []},
  pin76: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin77: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_miso","uart_tx","i2c_sda","spi_cs"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin78: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_cs","uart_rx","i2c_scl"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin79: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_sck","i2c_sda","uart_tx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true},
  pin80: {isBidirectional: true, canUseTriState: true, capabilities: ["spi_mosi","i2c_scl","uart_rx"], canUseInternalPullup: true, canUseInternalPulldown: true, canUseOpenDrain: true, canUsePushPull: true, isGpio: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const RP2354B = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C39843328"
  ]
}}
      manufacturerPartNumber="RP2354B"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-4.907534mm" pcbY="3.800094mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="-4.907534mm" pcbY="3.400044mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin3"]} pcbX="-4.907534mm" pcbY="2.999994mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin4"]} pcbX="-4.907534mm" pcbY="2.599944mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin5"]} pcbX="-4.907534mm" pcbY="2.199894mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin6"]} pcbX="-4.907534mm" pcbY="1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin7"]} pcbX="-4.907534mm" pcbY="1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin8"]} pcbX="-4.907534mm" pcbY="0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin9"]} pcbX="-4.907534mm" pcbY="0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin10"]} pcbX="-4.907534mm" pcbY="0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin11"]} pcbX="-4.907534mm" pcbY="-0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin12"]} pcbX="-4.907534mm" pcbY="-0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin13"]} pcbX="-4.907534mm" pcbY="-0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin14"]} pcbX="-4.907534mm" pcbY="-1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin15"]} pcbX="-4.907534mm" pcbY="-1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin16"]} pcbX="-4.907534mm" pcbY="-2.199894mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin17"]} pcbX="-4.907534mm" pcbY="-2.599944mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin18"]} pcbX="-4.907534mm" pcbY="-2.999994mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin19"]} pcbX="-4.907534mm" pcbY="-3.400044mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin20"]} pcbX="-4.907534mm" pcbY="-3.800094mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin21"]} pcbX="-3.800094mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin22"]} pcbX="-3.400044mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin23"]} pcbX="-2.999994mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin24"]} pcbX="-2.599944mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin25"]} pcbX="-2.199894mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin26"]} pcbX="-1.800098mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin27"]} pcbX="-1.400048mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin28"]} pcbX="-0.999998mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin29"]} pcbX="-0.599948mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin30"]} pcbX="-0.199898mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin31"]} pcbX="0.199898mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin32"]} pcbX="0.599948mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin33"]} pcbX="0.999998mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin34"]} pcbX="1.400048mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin35"]} pcbX="1.800098mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin36"]} pcbX="2.199894mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin37"]} pcbX="2.599944mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin38"]} pcbX="2.999994mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin39"]} pcbX="3.400044mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin40"]} pcbX="3.800094mm" pcbY="-4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin41"]} pcbX="4.907534mm" pcbY="-3.800094mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin42"]} pcbX="4.907534mm" pcbY="-3.400044mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin43"]} pcbX="4.907534mm" pcbY="-2.999994mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin44"]} pcbX="4.907534mm" pcbY="-2.599944mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin45"]} pcbX="4.907534mm" pcbY="-2.199894mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin46"]} pcbX="4.907534mm" pcbY="-1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin47"]} pcbX="4.907534mm" pcbY="-1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin48"]} pcbX="4.907534mm" pcbY="-0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin49"]} pcbX="4.907534mm" pcbY="-0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin50"]} pcbX="4.907534mm" pcbY="-0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin51"]} pcbX="4.907534mm" pcbY="0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin52"]} pcbX="4.907534mm" pcbY="0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin53"]} pcbX="4.907534mm" pcbY="0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin54"]} pcbX="4.907534mm" pcbY="1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin55"]} pcbX="4.907534mm" pcbY="1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin56"]} pcbX="4.907534mm" pcbY="2.199894mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin57"]} pcbX="4.907534mm" pcbY="2.599944mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin58"]} pcbX="4.907534mm" pcbY="2.999994mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin59"]} pcbX="4.907534mm" pcbY="3.400044mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin60"]} pcbX="4.907534mm" pcbY="3.800094mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin61"]} pcbX="3.800094mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin62"]} pcbX="3.400044mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin63"]} pcbX="2.999994mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin64"]} pcbX="2.599944mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin65"]} pcbX="2.199894mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin66"]} pcbX="1.800098mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin67"]} pcbX="1.400048mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin68"]} pcbX="0.999998mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin69"]} pcbX="0.599948mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin70"]} pcbX="0.199898mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin71"]} pcbX="-0.199898mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin72"]} pcbX="-0.599948mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin73"]} pcbX="-0.999998mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin74"]} pcbX="-1.400048mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin75"]} pcbX="-1.800098mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin76"]} pcbX="-2.199894mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin77"]} pcbX="-2.599944mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin78"]} pcbX="-2.999994mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin79"]} pcbX="-3.400044mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin80"]} pcbX="-3.800094mm" pcbY="4.907534mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin81"]} pcbX="0mm" pcbY="-0mm" width="3.3999932mm" height="3.3999932mm" shape="rect" noSolderPaste />
{/* Four 1.25 mm windows give 54% paste coverage on the exposed pad. */}
{[-.725,.725].flatMap(x=>[-.725,.725].map(y=><solderpaste key={`${x}/${y}`} shape="rect" width="1.25mm" height="1.25mm" pcbX={x} pcbY={y} />))}
<silkscreenpath route={[{"x":-5.076189999999997,"y":4.064380999999997},{"x":-5.076189999999997,"y":5.076189999999997},{"x":-4.064380999999997,"y":5.076189999999997}]} />
<silkscreenpath route={[{"x":5.076190000000011,"y":4.064380999999997},{"x":5.076190000000011,"y":5.076189999999997},{"x":4.064381000000012,"y":5.076189999999997}]} />
<silkscreenpath route={[{"x":5.076190000000011,"y":-4.064381000000012},{"x":5.076190000000011,"y":-5.076189999999997},{"x":4.064381000000012,"y":-5.076189999999997}]} />
<silkscreenpath route={[{"x":-5.076189999999997,"y":-4.064381000000012},{"x":-5.076189999999997,"y":-5.076189999999997},{"x":-4.064380999999997,"y":-5.076189999999997}]} />
<silkscreencircle pcbX="-5.6575198mm" pcbY="3.800094mm" radius="0.1500124mm" />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-5.4900327,"y":5.4900327},{"x":5.4900327,"y":5.4900327},{"x":5.4900327,"y":-5.490032700000015},{"x":-5.4900327,"y":-5.490032700000015},{"x":-5.4900327,"y":5.4900327}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C39843328.obj?uuid=79624d072a514f4d8479339def74168a",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C39843328.step?uuid=79624d072a514f4d8479339def74168a",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999984988608, y: 0, z: -0.03 },
      }}
      {...props}
    />
  )
}