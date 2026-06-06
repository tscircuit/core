import { expect, test } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rp2040PinLabels = {
  pin1: "IOVDD_1",
  pin2: "GPIO0",
  pin3: "GPIO1",
  pin4: "GPIO2",
  pin5: "GPIO3",
  pin6: "GPIO4",
  pin7: "GPIO5",
  pin8: "GPIO6",
  pin9: "GPIO7",
  pin10: "IOVDD_2",
  pin11: "GPIO8",
  pin12: "GPIO9",
  pin13: "GPIO10",
  pin14: "GPIO11",
  pin15: "GPIO12",
  pin16: "GPIO13",
  pin17: "GPIO14",
  pin18: "GPIO15",
  pin19: "TESTEN",
  pin20: "XIN",
  pin21: "XOUT",
  pin22: "IOVDD_3",
  pin23: "DVDD_1",
  pin24: "SWCLK",
  pin25: "SWDIO",
  pin26: "RUN",
  pin27: "GPIO16",
  pin28: "GPIO17",
  pin29: "GPIO18",
  pin30: "GPIO19",
  pin31: "GPIO20",
  pin32: "GPIO21",
  pin33: "IOVDD_4",
  pin34: "GPIO22",
  pin35: "GPIO23",
  pin36: "GPIO24",
  pin37: "GPIO25",
  pin38: "GPIO26_ADC0",
  pin39: "GPIO27_ADC1",
  pin40: "GPIO28_ADC2",
  pin41: "GPIO29_ADC3",
  pin42: "IOVDD_5",
  pin43: "ADC_AVDD",
  pin44: "VREG_VIN",
  pin45: "VREG_VOUT",
  pin46: "USB_DM",
  pin47: "USB_DP",
  pin48: "USB_VDD",
  pin49: "IOVDD_6",
  pin50: "DVDD_2",
  pin51: "QSPI_SD3",
  pin52: "QSPI_SCLK",
  pin53: "QSPI_SD0",
  pin54: "QSPI_SD2",
  pin55: "QSPI_SD1",
  pin56: "QSPI_SS",
} as const

test("breakout routes rp2040 pins to nearby capacitors and resistors", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="72mm" height="48mm">
      <breakout name="RP2040_BREAKOUT" padding="3mm">
        <chip
          name="U1"
          footprint="qfn56"
          pinLabels={rp2040PinLabels}
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C_LOCAL"
          capacitance="100nF"
          footprint="0402"
          pcbX={-6.2}
          pcbY={3.2}
        />
        <resistor
          name="R_TESTEN"
          resistance="1k"
          footprint="0402"
          pcbX={-6.2}
          pcbY={-3.2}
        />
        <trace from="U1.IOVDD_2" to="C_LOCAL.1" />
        <trace from="U1.GPIO20" to="C_LOCAL.2" />
        <trace from="U1.TESTEN" to="R_TESTEN.1" />
        <trace from="U1.GPIO22" to="R_TESTEN.2" />
      </breakout>

      <capacitor
        name="C6"
        capacitance="100nF"
        footprint="0402"
        pcbX={-20}
        pcbY={14}
      />
      <capacitor
        name="C7"
        capacitance="100nF"
        footprint="0402"
        pcbX={-16}
        pcbY={14}
      />
      <capacitor
        name="C8"
        capacitance="1uF"
        footprint="0402"
        pcbX={-14}
        pcbY={10}
      />

      <capacitor
        name="C9"
        capacitance="100nF"
        footprint="0402"
        pcbX={4}
        pcbY={14}
      />
      <capacitor
        name="C11"
        capacitance="100nF"
        footprint="0402"
        pcbX={8}
        pcbY={14}
      />
      <capacitor
        name="C12"
        capacitance="100nF"
        footprint="0402"
        pcbX={12}
        pcbY={14}
      />
      <capacitor
        name="C13"
        capacitance="100nF"
        footprint="0402"
        pcbX={16}
        pcbY={14}
      />
      <capacitor
        name="C14"
        capacitance="100nF"
        footprint="0402"
        pcbX={20}
        pcbY={14}
      />
      <capacitor
        name="C15"
        capacitance="100nF"
        footprint="0402"
        pcbX={24}
        pcbY={14}
      />
      <capacitor
        name="C16"
        capacitance="100nF"
        footprint="0402"
        pcbX={28}
        pcbY={14}
      />
      <capacitor
        name="C10"
        capacitance="1uF"
        footprint="0402"
        pcbX={8}
        pcbY={10}
      />

      <resistor
        name="R3"
        resistance="27.4"
        footprint="0402"
        pcbX={20}
        pcbY={5}
      />
      <resistor
        name="R4"
        resistance="27.4"
        footprint="0402"
        pcbX={20}
        pcbY={3}
      />

      <trace from="U1.DVDD_1" to="C6.1" />
      <trace from="U1.VREG_VOUT" to="C6.2" />
      <trace from="U1.DVDD_2" to="C7.1" />
      <trace from="U1.VREG_VIN" to="C7.2" />
      <trace from="U1.IOVDD_3" to="C8.1" />
      <trace from="U1.IOVDD_4" to="C8.2" />
      <trace from="U1.IOVDD_1" to="C9.1" />
      <trace from="U1.IOVDD_5" to="C9.2" />
      <trace from="U1.IOVDD_6" to="C11.1" />
      <trace from="U1.USB_VDD" to="C11.2" />

      <trace from="U1.ADC_AVDD" to="C12.1" />
      <trace from="U1.GPIO29_ADC3" to="C12.2" />
      <trace from="U1.GPIO23" to="C13.1" />
      <trace from="U1.GPIO24" to="C13.2" />
      <trace from="U1.GPIO25" to="C14.1" />
      <trace from="U1.GPIO26_ADC0" to="C14.2" />
      <trace from="U1.GPIO27_ADC1" to="C15.1" />
      <trace from="U1.GPIO28_ADC2" to="C15.2" />
      <trace from="U1.GPIO0" to="C16.1" />
      <trace from="U1.GPIO1" to="C16.2" />
      <trace from="U1.GPIO2" to="C10.1" />
      <trace from="U1.GPIO3" to="C10.2" />
      <trace from="U1.USB_DP" to="R3.1" />
      <trace from="U1.USB_DM" to="R4.1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutSourceGroup = circuit.db.source_group.getWhere({
    name: "RP2040_BREAKOUT",
  })
  const breakoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: breakoutSourceGroup!.source_group_id,
  })

  expect(breakoutPcbGroup).toBeDefined()
  const breakoutPhase = autoroutingPhaseIoStack.find(
    (phase) => phase.subcircuit_id === breakoutSourceGroup!.subcircuit_id,
  )
  expect(breakoutPhase).toBeDefined()
  const breakoutSimpleRouteJson = breakoutPhase!.startSimpleRouteJson!
  const directBreakoutSimpleRouteJson = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: breakoutSourceGroup!.subcircuit_id,
  }).simpleRouteJson
  const expectedBreakoutBounds = {
    minX: breakoutPcbGroup!.center.x - breakoutPcbGroup!.width! / 2,
    maxX: breakoutPcbGroup!.center.x + breakoutPcbGroup!.width! / 2,
    minY: breakoutPcbGroup!.center.y - breakoutPcbGroup!.height! / 2,
    maxY: breakoutPcbGroup!.center.y + breakoutPcbGroup!.height! / 2,
  }
  // COMMENTED OUT AS ITS FAILING ON CI WITH IMAGE DIFF DUE TO OS ISSUES.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "breakout-rp2040-with-passives-autorouting-srj",
    circuit,
  )

  expect(breakoutSimpleRouteJson.bounds).toEqual(expectedBreakoutBounds)
  expect(directBreakoutSimpleRouteJson.bounds).toEqual(expectedBreakoutBounds)
  expect(circuit.db.pcb_breakout_point.list().length).toBe(24)
  expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(2)
  // expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(21)
  // expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  const drcErrors = circuit.db.pcb_trace_error.list()

  // expect(drcErrors).toHaveLength(0)
  // expect(
  //   drcErrors.filter((error) => error.message.includes("overlaps with")),
  // ).toHaveLength(0)
  // expect(
  //   drcErrors.filter((error) => error.message.includes("too close")),
  // ).toHaveLength(0)
  // expect(
  //   drcErrors.filter((error) =>
  //     error.message.includes("disconnected endpoint"),
  //   ),
  // ).toHaveLength(0)
  // expect(
  //   drcErrors.filter((error) => error.message.includes("missing a connection")),
  // ).toHaveLength(0)

  // Dump the parent (board) SRJ as a standalone repro asset for the autorouter.
  // Feeding this SRJ to AutoroutingPipelineSolver4 reproduces the throw below
  // without rendering the whole circuit: the descendant breakout handoff copper
  // is modeled as same-net obstacles (obstacle.connectedTo), yet the autorouter
  // still can't resolve the breakout-point terminal that sits on that copper.
  const boardPhase = autoroutingPhaseIoStack.find((phase) =>
    phase.componentDisplayName?.includes("<board"),
  )
  expect(boardPhase?.startSimpleRouteJson).toBeDefined()
  const assetsDir = path.join(import.meta.dir, "assets")
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.writeFileSync(
    path.join(assetsDir, "breakout-rp2040-with-passives-srj.json"),
    `${JSON.stringify(boardPhase!.startSimpleRouteJson, null, 2)}\n`,
  )

  // Repro: the parent autorouter throws because region resolution is geometric
  // and net-agnostic — the same-net handoff copper occupies the terminal's
  // layer, so there's no node on that layer for the terminal to resolve into.
  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toContain(
    "Could not find start region for connection",
  )
}, 60_000)
