import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["VSS"],
  pin8: ["pin8"],
  pin9: ["VDD"],
  pin10: ["pin10"],
  pin11: ["pin11"],
  pin12: ["pin12"],
  pin13: ["pin13"],
  pin14: ["pin14"],
  pin15: ["pin15"],
  pin16: ["pin16"],
  pin17: ["pin17"],
  pin18: ["pin18"],
  pin19: ["pin19"],
  pin20: ["pin20"],
} as const

const CH32V003F4P6 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      manufacturerPartNumber="CH32V003F4P6"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.925064000000134mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-2.2750780000000077mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.6250920000001088mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.9751059999999825mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.32486600000004273mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.32512000000008356mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.9751059999999825mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.625091999999995mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="2.2750780000000077mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="2.9250640000000203mm"
            pcbY="-2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-2.925064000000134mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-2.2750780000000077mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-1.6250920000001088mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-0.9751059999999825mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-0.32486600000004273mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="0.32512000000008356mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="0.9751059999999825mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="1.625091999999995mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="2.2750780000000077mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="2.9250640000000203mm"
            pcbY="2.870961999999963mm"
            width="0.3640074mm"
            height="1.7420082mm"
            shape="rect"
          />
        </footprint>
      }
      {...props}
    />
  )
}

interface GreenpillProps extends ChipProps {
  name: string
  resetButton?: boolean
  jumper?: boolean
  powerLED?: boolean
  testLED?: boolean
  VDD?: string[]
  VSS?: string[]
  PD4?: string[]
  PD5?: string[]
  PD6?: string[]
  PD7?: string[]
  PA1?: string[]
  PA2?: string[]
  PD0?: string[]
  PC0?: string[]
  PC1?: string[]
  PC2?: string[]
  PC3?: string[]
  PC4?: string[]
  PC5?: string[]
  PC6?: string[]
  PC7?: string[]
  PD1?: string[]
  PD2?: string[]
  PD3?: string[]
  pcbX?: number
  pcbY?: number
}

const Greenpill = ({
  name,
  resetButton = true,
  jumper = true,
  powerLED = true,
  testLED = true,
  VDD = [],
  VSS = [],
  PD4 = ["net.PD4"],
  PD5 = ["net.PD5"],
  PD6 = ["net.PD6"],
  PD7 = ["net.PD7"],
  PA1 = ["net.PA1"],
  PA2 = ["net.PA2"],
  PD0 = ["net.PD0"],
  PC0 = ["net.PC0"],
  PC1 = ["net.PC1"],
  PC2 = ["net.PC2"],
  PC3 = ["net.PC3"],
  PC4 = ["net.PC4"],
  PC5 = ["net.PC5"],
  PC6 = ["net.PC6"],
  PC7 = ["net.PC7"],
  PD1 = ["net.PD1"],
  PD2 = ["net.PD2"],
  PD3 = ["net.PD3"],
  pcbX = 0,
  pcbY = 0,
  schX = 0,
  schY = 0,
  ...props
}: GreenpillProps) => {
  return (
    <group name={name} pcbX={pcbX} pcbY={pcbY} schX={schX} schY={schY}>
      <CH32V003F4P6
        name="U1"
        pcbRotation={90}
        connections={{
          VDD: ["net.VDD", ...VDD],
          VSS: ["net.GND", ...VSS],
          pin2: ["net.BOARD_TX", ...PD5],
          pin3: ["net.BOARD_RX", ...PD6],
          pin4: ["net.RST", ...PD7],
          pin18: ["net.SWIO", ...PD1],
          pin1: PD4,
          pin5: PA1,
          pin6: PA2,
          pin7: VSS,
          pin8: PD0,
          pin9: VDD,
          pin10: PC0,
          pin11: PC1,
          pin12: PC2,
          pin13: PC3,
          pin14: PC4,
          pin15: PC5,
          pin16: PC6,
          pin17: PC7,
          pin19: PD2,
          pin20: PD3,
        }}
      />

      {/* Programming interface */}
      {jumper && (
        <jumper
          name="J1_greenpill"
          footprint="pinrow3"
          connections={{
            pin1: "net.SWIO",
            pin2: "net.GND",
            pin3: "net.VDD",
          }}
          pcbX={3}
          pcbY={6}
          doNotPlace
        />
      )}
    </group>
  )
}

test(
  "dev-board should not have false positive trace-smtpad overlap errors",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        width="40mm"
        height="28mm"
        schematicDisabled
        outlineOffsetX="-7.5mm"
      >
        <Greenpill name="greenpill" powerLED={false} resetButton={false} />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    // Check for trace errors
    const traceErrors = circuitJson.filter(
      (el) => el.type === "pcb_trace_error",
    )

    // Filter for "accidental contact" errors with smtpads
    const accidentalContactErrors = traceErrors.filter((err) =>
      (err as any).message?.includes("accidental contact"),
    )

    console.log(
      `\nAccidental contact errors with smtpads: ${accidentalContactErrors.length}`,
    )

    expect(accidentalContactErrors.length).toBe(2)

    expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      shouldDrawErrors: true,
    })
  },
  { timeout: 60000 },
)
