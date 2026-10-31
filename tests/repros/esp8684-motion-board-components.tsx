import type { ChipProps, CrystalProps } from "@tscircuit/props"

const ap2112PinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["VOUT"],
} as const

const ap2112PinAttributes = {
  pin1: {
    isInput: true,
    requiresPower: true,
    mustBeConnected: true,
    shouldHaveDecouplingCapacitor: true,
    recommendedDecouplingCapacitorCapacitance: "1uF",
  },
  pin2: { requiresGround: true, mustBeConnected: true },
  pin4: { doNotConnect: true },
  pin5: {
    isOutput: true,
    providesPower: true,
    providesVoltage: "3.3V",
    shouldHaveDecouplingCapacitor: true,
    recommendedDecouplingCapacitorCapacitance: "1uF",
  },
  pin3: { isInput: true },
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const AP2112K_3_3TRG1 = (props: ChipProps<typeof ap2112PinLabels>) => {
  return (
    <chip
      pinLabels={ap2112PinLabels}
      pinAttributes={ap2112PinAttributes}
      manufacturerPartNumber="AP2112K-3.3TRG1"
      {...props}
    />
  )
}

type ImportedCrystalProps = Omit<CrystalProps, "frequency" | "pinVariant">

export const A_3225_40M_12PF_10PPM = (props: ImportedCrystalProps) => {
  const { name = "X1", ...restProps } = props

  return (
    <crystal
      name={name}
      frequency="40MHz"
      pinVariant="four_pin"
      manufacturerPartNumber="3225 40M 12PF 10PPM"
      {...restProps}
    />
  )
}

const esp8684PinLabels = {
  pin1: ["ANT"],
  pin2: ["VDDA3P32"],
  pin3: ["VDDA3P31"],
  pin4: ["GPIO0"],
  pin5: ["GPIO1"],
  pin6: ["GPIO2"],
  pin7: ["CHIP_EN"],
  pin8: ["GPIO3"],
  pin9: ["MTMS"],
  pin10: ["MTDI"],
  pin11: ["VDD3P3_RTC"],
  pin12: ["MTCK"],
  pin13: ["MTDO"],
  pin14: ["GPIO8"],
  pin15: ["GPIO9"],
  pin16: ["GPIO10"],
  pin17: ["VDD3P3_CPU"],
  pin18: ["GPIO18"],
  pin19: ["U0RXD"],
  pin20: ["U0TXD"],
  pin21: ["VDDA2"],
  pin22: ["XTAL_N"],
  pin23: ["XTAL_P"],
  pin24: ["VDDA1"],
  pin25: ["EP"],
} as const

const esp8684PinAttributes = {
  pin25: { requiresGround: true },
  pin21: { requiresPower: true },
  pin24: { requiresPower: true },
} as const

export const ESP8684H4X = (props: ChipProps<typeof esp8684PinLabels>) => {
  return (
    <chip
      pinLabels={esp8684PinLabels}
      pinAttributes={esp8684PinAttributes}
      manufacturerPartNumber="ESP8684H4X"
      {...props}
    />
  )
}

const mmbt3904PinLabels = {
  pin1: ["B"],
  pin2: ["E"],
  pin3: ["C"],
} as const

const mmbt3904PinAttributes = {
  pin1: { isInput: true },
  pin2: { isPassive: true },
  pin3: { isPassive: true },
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const MMBT3904_RANGE_100_300_ = (
  props: ChipProps<typeof mmbt3904PinLabels>,
) => {
  return (
    <chip
      pinLabels={mmbt3904PinLabels}
      pinAttributes={mmbt3904PinAttributes}
      symbol={
        <symbol>
          <port
            name="pin3"
            pinNumber={3}
            aliases={["C"]}
            direction="up"
            schX={0.2}
            schY={0.4}
            schStemLength={0.2}
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["B"]}
            direction="left"
            schX={-0.2}
            schY={0}
            schStemLength={0.2}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["E"]}
            direction="down"
            schX={0.2}
            schY={-0.4}
            schStemLength={0.2}
          />
          <schematicpath
            points={[
              { x: 0.2, y: 0.2 },
              { x: 0, y: 0.06 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.06 },
              { x: 0.2, y: -0.2 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.18 },
              { x: 0, y: -0.18 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.2, y: -0.2 },
              { x: 0.14, y: -0.1 },
              { x: 0.08, y: -0.18 },
              { x: 0.2, y: -0.2 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematictext
            schX={0}
            schY={0.64}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      manufacturerPartNumber="MMBT3904(RANGE:100-300)"
      {...props}
    />
  )
}

const pirPinLabels = {
  pin1: ["REL"],
  pin2: ["ONTIME"],
  pin3: ["OEN"],
  pin4: ["VDD"],
  pin5: ["SENS"],
  pin6: ["VSS"],
} as const

const pirPinAttributes = {
  pin4: { requiresPower: true },
  pin6: { requiresGround: true },
} as const

export const S18_L262B_2 = (props: ChipProps<typeof pirPinLabels>) => {
  return (
    <chip
      pinLabels={pirPinLabels}
      pinAttributes={pirPinAttributes}
      manufacturerPartNumber="S18-L262B-2"
      {...props}
    />
  )
}

const uFlPinLabels = {
  pin1: ["SIG"],
  pin2: ["GND2"],
  pin3: ["GND1"],
} as const

const uFlPinAttributes = {
  pin2: { requiresGround: true },
  pin3: { requiresGround: true },
} as const

export const U_FL_R_SMT_1_80_ = (props: ChipProps<typeof uFlPinLabels>) => {
  return (
    <chip
      pinLabels={uFlPinLabels}
      pinAttributes={uFlPinAttributes}
      manufacturerPartNumber="U.FL-R-SMT-1(80)"
      {...props}
    />
  )
}
