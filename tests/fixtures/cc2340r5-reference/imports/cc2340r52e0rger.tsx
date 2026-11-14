import type { ChipProps, PinAttributeMap } from "@tscircuit/props"

const pinLabels = {
  pin1: ["ANT"],
  pin2: ["VDDR1"],
  pin3: ["DIO8"],
  pin4: ["DIO11"],
  pin5: ["DIO12"],
  pin6: ["DIO13"],
  pin7: ["DIO16_SWDIO"],
  pin8: ["DIO17_SWDCK"],
  pin9: ["DIO20_A11"],
  pin10: ["DIO21_A10"],
  pin11: ["VDDS1"],
  pin12: ["DIO24_A7"],
  pin13: ["RSTN"],
  pin14: ["DIO3_X32P"],
  pin15: ["DIO4_X32N"],
  pin16: ["VDDD"],
  pin17: ["DCDC"],
  pin18: ["VDDS2"],
  pin19: ["DIO6_A1"],
  pin20: ["VDDR2"],
  pin21: ["X48P"],
  pin22: ["X48N"],
  pin23: ["GND"],
  pin24: ["VDDS3"],
  pin25: ["EP"],
} as const

export const cc2340PinAttributes: Record<string, PinAttributeMap> = {
  pin23: { requiresGround: true, mustBeConnected: true },
  pin1: { isBidirectional: true },
  pin2: {
    mustBeConnected: true,
    shouldHaveDecouplingCapacitor: true,
    recommendedDecouplingCapacitorCapacitance: "10uF",
  },
  pin3: {
    isBidirectional: true,
    capabilities: ["spi_sck", "i2c_sda"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin4: {
    isBidirectional: true,
    capabilities: ["spi_cs", "spi_miso"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin5: {
    isBidirectional: true,
    capabilities: ["spi_miso", "spi_mosi", "uart_rx", "i2c_sda"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin6: {
    isBidirectional: true,
    capabilities: ["spi_miso", "spi_mosi", "uart_tx"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin7: {
    isBidirectional: true,
    capabilities: ["spi_mosi", "uart_rx", "i2c_sda"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin8: {
    isBidirectional: true,
    capabilities: ["spi_sck", "uart_tx", "i2c_scl"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin9: {
    isBidirectional: true,
    capabilities: ["uart_tx", "uart_rx", "spi_miso"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin10: {
    isBidirectional: true,
    capabilities: ["spi_miso"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin11: {
    requiresPower: true,
    mustBeConnected: true,
    shouldHaveDecouplingCapacitor: true,
  },
  pin12: {
    isBidirectional: true,
    capabilities: ["spi_sck", "i2c_scl"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin13: { isInput: true },
  pin14: {
    isBidirectional: true,
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin15: {
    isBidirectional: true,
    capabilities: ["uart_tx", "spi_mosi"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin16: { mustBeConnected: true, shouldHaveDecouplingCapacitor: true },
  pin18: {
    requiresPower: true,
    mustBeConnected: true,
    shouldHaveDecouplingCapacitor: true,
  },
  pin19: {
    isBidirectional: true,
    capabilities: ["spi_cs", "i2c_scl", "uart_tx"],
    canUseInternalPullup: true,
    canUseInternalPulldown: true,
    canUseOpenDrain: true,
    canUsePushPull: true,
    isGpio: true,
  },
  pin20: {
    mustBeConnected: true,
    shouldHaveDecouplingCapacitor: true,
    recommendedDecouplingCapacitorCapacitance: "10uF",
  },
  pin24: {
    requiresPower: true,
    mustBeConnected: true,
    shouldHaveDecouplingCapacitor: true,
  },
  pin25: { mustBeConnected: true },
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const CC2340R52E0RGER = ({
  pinAttributes: selectedPinAttributes,
  ...props
}: Omit<ChipProps<typeof pinLabels>, "pinAttributes"> & {
  pinAttributes?: Partial<
    NonNullable<ChipProps<typeof pinLabels>["pinAttributes"]>
  >
}) => {
  // Keep imported hardware capabilities while applying this board's selected
  // functions/electrical settings to each physical pin.
  const overrides: Record<string, PinAttributeMap> = selectedPinAttributes ?? {}
  const pinAttributes = Object.fromEntries(
    Object.keys({ ...cc2340PinAttributes, ...overrides }).map((pin) => [
      pin,
      { ...cc2340PinAttributes[pin], ...overrides[pin] },
    ]),
  )
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C20416850"],
      }}
      manufacturerPartNumber="CC2340R52E0RGER"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.89992mm"
            pcbY="1.250061mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.89992mm"
            pcbY="0.750189mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.89992mm"
            pcbY="0.250063mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.89992mm"
            pcbY="-0.249809mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.89992mm"
            pcbY="-0.749935mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-1.89992mm"
            pcbY="-1.249807mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-1.250188mm"
            pcbY="-1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-0.750316mm"
            pcbY="-1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-0.25019mm"
            pcbY="-1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="0.249682mm"
            pcbY="-1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0.749808mm"
            pcbY="-1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="1.24968mm"
            pcbY="-1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="1.89992mm"
            pcbY="-1.250061mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="1.89992mm"
            pcbY="-0.749935mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="1.89992mm"
            pcbY="-0.250063mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="1.89992mm"
            pcbY="0.250063mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="1.89992mm"
            pcbY="0.749935mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="1.89992mm"
            pcbY="1.250061mm"
            width="0.5999988mm"
            height="0.2500122mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="1.24968mm"
            pcbY="1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="0.749808mm"
            pcbY="1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="0.249682mm"
            pcbY="1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-0.25019mm"
            pcbY="1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="-0.750316mm"
            pcbY="1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="-1.250188mm"
            pcbY="1.900047mm"
            width="0.2500122mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="0mm"
            pcbY="-0.000127mm"
            width="2.4500078mm"
            height="2.4500078mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.1044915999999603, y: 1.7001743999999235 },
              { x: -2.1044915999999603, y: 2.100148200000035 },
              { x: -1.7001743999999235, y: 2.1000212000000147 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.1001990000000887, y: -1.6998696000000564 },
              { x: -2.1001990000000887, y: -2.0999704000000747 },
              { x: -1.7001743999999235, y: -2.0999704000000747 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.0997926000000007, y: -1.5999713999999585 },
              { x: 2.0997926000000007, y: -2.0999704000000747 },
              { x: 1.6998188000001164, y: -2.0999704000000747 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.6954753999999639, y: 2.100148200000035 },
              { x: 2.095449199999962, y: 2.100148200000035 },
              { x: 2.095449199999962, y: 1.7001743999999235 },
            ]}
          />
          <silkscreencircle pcbX={-1.65} pcbY={1.65} radius={0.12} />
          <courtyardoutline
            outline={[
              { x: -2.45, y: -2.45 },
              { x: 2.45, y: -2.45 },
              { x: 2.45, y: 2.45 },
              { x: -2.45, y: 2.45 },
              { x: -2.45, y: -2.45 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C20416850.obj?uuid=d7837941ee5a48928cbbb5a65ba7a879",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C20416850.step?uuid=d7837941ee5a48928cbbb5a65ba7a879",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000025400000026820635, z: 0 },
      }}
      {...props}
    />
  )
}
