import type { ChipProps } from "@tscircuit/props"

interface Props extends ChipProps {
  name: string
  resetButton?: boolean
  jumper?: boolean
  powerLED?: boolean
  VDD?: string[]
  VSS?: string[]
  PD4?: string[] // pin1
  PD5?: string[] // pin2
  PD6?: string[] // pin3
  PD7?: string[] // pin4
  PA1?: string[] // pin5
  PA2?: string[] // pin6
  // GND is in pin7
  PD0?: string[] // pin8
  // VDD is in pin 9
  PC0?: string[] // pin10
  PC1?: string[] // pin11
  PC2?: string[] // pin12
  PC3?: string[] // pin13
  PC4?: string[] // pin14
  PC5?: string[] // pin15
  PC6?: string[] // pin16
  PC7?: string[] // pin17
  PD1?: string[] // pin18
  PD2?: string[] // pin19
  PD3?: string[] // pin20
  pcbX?: number
  pcbY?: number
  pcbXJumper?: number
  pcbYJumper?: number
}

export default ({
  name,
  resetButton = true,
  jumper = true,
  powerLED = true,
  VDD = [],
  VSS = [],
  PD4 = [],
  PD5 = [],
  PD6 = [],
  PD7 = [],
  PA1 = [],
  PA2 = [],
  PD0 = [],
  PC0 = [],
  PC1 = [],
  PC2 = [],
  PC3 = [],
  PC4 = [],
  PC5 = [],
  PC6 = [],
  PC7 = [],
  PD1 = [],
  PD2 = [],
  PD3 = [],
  pcbX = 0,
  pcbY = 0,
  schX = 0,
  schY = 0,
  ...props
}: Props) => {
  return (
    <group name={name} pcbX={pcbX} pcbY={pcbY} schX={schX} schY={schY}>
      {/* Jumpers */}
      {jumper && (
        <jumper
          name="J1_greenpill"
          footprint="pinrow5"
          connections={{
            pin1: "net.GND",
            pin2: "net.RST",
            pin3: "net.SWIO",
            pin4: "net.BOARD_TX",
            pin5: "net.BOARD_RX",
          }}
          pcbX={3}
          pcbY={6}
        />
      )}

      {/* Pullup Resistors */}
      <resistor
        name="R1_greenpill"
        footprint="0603"
        resistance={100000}
        connections={{
          pos: "net.VDD",
          neg: "net.BOARD_RX",
        }}
        pcbRotation={-90}
        pcbX={10}
        pcbY={2}
      />

      {/* Decoupling Capacitors */}
      <capacitor
        name="C1_greenpill"
        capacitance="100n"
        connections={{
          anode: "net.VDD",
          cathode: "net.GND",
        }}
        footprint="0603"
        pcbRotation={-90}
        pcbX={7}
        pcbY={2}
      />

      {/* Reset switch */}
      {resetButton && (
        <group name="reset_button">
          <capacitor
            name="C2"
            capacitance="100n"
            connections={{
              anode: "net.RST",
              cathode: "net.GND",
            }}
            footprint="0603"
            pcbRotation={180}
            pcbX={2}
            pcbY={-5}
          />
        </group>
      )}

      {powerLED && (
        <group name="power_led">
          <resistor
            name="R2"
            resistance="1k"
            footprint="0603"
            connections={{
              pos: "net.VDD",
              neg: ".LED_PWR > .pos",
            }}
            pcbX={9}
            pcbY={-3}
          />
          <led
            name="LED_PWR"
            color="green"
            footprint="0603"
            connections={{
              pos: ".R2 > .neg",
              neg: "net.GND",
            }}
            pcbX={8}
            pcbY={-6}
            pcbRotation={180}
          />
        </group>
      )}
    </group>
  )
}
