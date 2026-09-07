import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Repro: Decoupling capacitors for U3 (T113-S3)
// Decoupling capacitors placed in rows for supply rails (P3V3, P0V9, P1V8, P1V5)
// and GND form trace connections between adjacent capacitors rather than
// displaying clean, individual net labels / power / ground symbols.

const t113PinLabels = {
  pin20: ["VCC_PLL"],
  pin26: ["VCC_RTC"],
  pin28: ["LDOA_OUT"],
  pin29: ["LDO_IN"],
  pin30: ["LDOB_OUT"],
  pin34: ["VCC_PE"],
  pin46: ["VDD_SYS0"],
  pin48: ["VCC_DRAM0"],
  pin49: ["VCC_DRAM1"],
  pin50: ["VDD18_DRAM"],
  pin51: ["VDD_SYS1"],
  pin65: ["VCC_LVDS"],
  pin66: ["VCC_PD"],
  pin77: ["VCC_TVOUT"],
  pin81: ["VDD_SYS2"],
  pin83: ["VCC_IO"],
  pin89: ["AVCC"],
  pin90: ["VRA2"],
  pin91: ["AGND"],
  pin92: ["VRA1"],
  pin97: ["HPVCC"],
  pin107: ["VCC_TVIN"],
  pin116: ["VDD_CORE0"],
  pin117: ["VDD_CORE1"],
  pin128: ["VCC_PG"],
  pin129: ["EPAD"],
} as const

test("repro182: Trellis Core C9-C15 decoupling capacitors snake traces", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board
      routingDisabled
      schAutoLayoutEnabled
      schTraceAutoLabelEnabled
      schMaxTraceDistance="0.8mm"
    >
      <schematictext
        text="REPRO: C9-C15 decoupling capacitors snake traces"
        schX={-6}
        schY={10}
        fontSize={0.3}
      />

      <chip
        name="U3"
        manufacturerPartNumber="T113-S3"
        schX={0}
        schY={0}
        schWidth="3mm"
        schHeight="13mm"
        pinLabels={t113PinLabels}
        connections={{
          pin28: "net.P1V8",
          pin29: "net.P3V3",
          pin30: "net.P1V5",
          pin34: "net.P3V3",
          pin46: "net.P0V9",
          pin48: "net.P1V5",
          pin49: "net.P1V5",
          pin50: "net.P1V8",
          pin51: "net.P0V9",
          pin65: "net.P1V8",
          pin66: "net.P3V3",
          pin77: "net.P3V3",
          pin81: "net.P0V9",
          pin83: "net.P3V3",
          pin89: "net.P1V8",
          pin91: "net.GND",
          pin97: "net.P1V8",
          pin107: "net.P1V8",
          pin116: "net.P0V9",
          pin117: "net.P0V9",
          pin128: "net.P3V3",
          pin129: "net.GND",
        }}
      />

      {/* Top row decoupling capacitors */}
      <capacitor
        name="C9"
        capacitance="2.2uF"
        schX={-12}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .LDO_IN"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C10"
        capacitance="10uF"
        schX={-10}
        schY={8}
        schOrientation="vertical"
        connections={{ pin1: "net.P3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C11"
        capacitance="100nF"
        schX={-8}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_IO"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C12"
        capacitance="100nF"
        schX={-6}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_PE"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C13"
        capacitance="100nF"
        schX={-4}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_PG"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C14"
        capacitance="100nF"
        schX={-2}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_PD"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C15"
        capacitance="100nF"
        schX={0}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_TVOUT"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C16"
        capacitance="2.2uF"
        schX={2}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .LDOA_OUT"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C17"
        capacitance="100nF"
        schX={4}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_RTC"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C18"
        capacitance="100nF"
        schX={6}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_PLL"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C19"
        capacitance="100nF"
        schX={8}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_TVIN"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C20"
        capacitance="100nF"
        schX={10}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_LVDS"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C21"
        capacitance="100nF"
        schX={12}
        schY={8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VDD18_DRAM"
        decouplingTo="net.GND"
      />

      {/* Bottom row decoupling capacitors */}
      <capacitor
        name="C22"
        capacitance="10uF"
        schX={-12}
        schY={-8}
        schOrientation="vertical"
        connections={{ pin1: "net.P0V9", pin2: "net.GND" }}
      />
      <capacitor
        name="C23"
        capacitance="100nF"
        schX={-10}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VDD_SYS0"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C24"
        capacitance="100nF"
        schX={-8}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VDD_SYS1"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C25"
        capacitance="100nF"
        schX={-6}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VDD_SYS2"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C26"
        capacitance="100nF"
        schX={-4}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VDD_CORE0"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C27"
        capacitance="100nF"
        schX={-2}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VDD_CORE1"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C28"
        capacitance="100nF"
        schX={5}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .LDOB_OUT"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C29"
        capacitance="10uF"
        schX={7}
        schY={-8}
        schOrientation="vertical"
        connections={{ pin1: "net.P1V5", pin2: "net.GND" }}
      />
      <capacitor
        name="C30"
        capacitance="100nF"
        schX={9}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_DRAM1"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C31"
        capacitance="100nF"
        schX={11}
        schY={-8}
        schOrientation="vertical"
        decouplingFor=".U3 > .VCC_DRAM0"
        decouplingTo="net.GND"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  const traces = json.filter((x: any) => x.type === "schematic_trace")

  const hasTraceBetween = (x1: number, x2: number, yApprox: number) =>
    traces.some((t: any) => {
      const from = t.edges?.[0]?.from
      const to = t.edges?.at(-1)?.to
      if (!from || !to) return false
      const minX = Math.min(from.x, to.x)
      const maxX = Math.max(from.x, to.x)
      const targetMin = Math.min(x1, x2)
      const targetMax = Math.max(x1, x2)
      return (
        Math.abs(minX - targetMin) < 0.2 &&
        Math.abs(maxX - targetMax) < 0.2 &&
        Math.abs(from.y - yApprox) < 0.5
      )
    })

  // Traces between adjacent parallel decoupling capacitors:
  expect(hasTraceBetween(-12, -10, 8.3)).toBe(true) // C9.1 - C10.1 (top)
  expect(hasTraceBetween(-8, -6, 8.3)).toBe(true) // C11.1 - C12.1 (top)
  expect(hasTraceBetween(-2, 0, 8.3)).toBe(true) // C14.1 - C15.1 (top)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
