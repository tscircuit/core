import { expect, test } from "bun:test"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rp2040PinLabels = {
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
  pin57: ["GND", "thermalpad"],
} as const

const decouplingCapacitors = [
  { name: "C_IOVDD6", pin: "IOVDD6", pcbX: -5.5, pcbY: 3 },
  { name: "C_IOVDD5", pin: "IOVDD5", pcbX: -5.5, pcbY: 0 },
  { name: "C_IOVDD4", pin: "IOVDD4", pcbX: -5.5, pcbY: -3 },
  { name: "C_IOVDD3", pin: "IOVDD3", pcbX: 5.5, pcbY: -3 },
  { name: "C_IOVDD2", pin: "IOVDD2", pcbX: 5.5, pcbY: 0 },
  { name: "C_IOVDD1", pin: "IOVDD1", pcbX: 5.5, pcbY: 3 },
  { name: "C_DVDD2", pin: "DVDD2", pcbX: -2.7, pcbY: -5.7 },
  { name: "C_DVDD1", pin: "DVDD1", pcbX: 2.7, pcbY: -5.7 },
  { name: "C_ADC", pin: "ADC_AVDD", pcbX: 5.5, pcbY: 5.2 },
  { name: "C_USB", pin: "USB_VDD", pcbX: 2.7, pcbY: 6.2 },
] as const

const runFlatComparison = process.env.RUN_RP2040_FLAT_COMPARISON === "1"

const gpioBanks = [
  {
    name: "U_CONTROLS",
    footprint: "tssop20",
    pcbX: -32,
    pcbY: 13,
    pcbRotation: 90,
    pins: [
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
    ],
  },
  {
    name: "U_DISPLAY",
    footprint: "soic16",
    pcbX: 32,
    pcbY: 9,
    pcbRotation: 90,
    pins: [
      "GPIO10",
      "GPIO11",
      "GPIO12",
      "GPIO13",
      "GPIO14",
      "GPIO15",
      "GPIO16",
      "GPIO17",
    ],
  },
  {
    name: "J_EXPANSION",
    footprint: "pinrow10",
    pcbX: -32,
    pcbY: -14,
    pcbRotation: 90,
    pins: [
      "GPIO18",
      "GPIO19",
      "GPIO20",
      "GPIO21",
      "GPIO22",
      "GPIO23",
      "GPIO24",
      "GPIO25",
      "GPIO26_ADC0",
      "GPIO27_ADC1",
    ],
  },
] as const

/**
 * This regression intentionally runs the real child and parent autorouters so
 * the phase snapshot proves that the outer connections finish routing. The
 * same circuit can be routed without the subcircuit phase split using:
 *
 * RUN_RP2040_FLAT_COMPARISON=1 bun test \
 *   tests/repros/repro-rp2040-subcircuit-autorouting-slowdown.test.tsx
 */
test("RP2040 subcircuit completes parent routing through child attachment points", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const rp2040Selector = runFlatComparison ? ".U1" : ".RP2040_CORE .U1"
  const rp2040Core = (
    <>
      <chip
        name="U1"
        manufacturerPartNumber="RP2040"
        pinLabels={rp2040PinLabels}
        footprint="qfn56_thermalpad3.1mmx3.1mm_p0.4001mm_w7.8999mm_h7.9001mm_pw0.2mm_pl0.85mm"
        pcbX={0}
        pcbY={0}
      />

      {decouplingCapacitors.map(({ name, pcbX, pcbY }) => (
        <capacitor
          key={name}
          name={name}
          capacitance="100nF"
          footprint="0402"
          pcbX={pcbX}
          pcbY={pcbY}
        />
      ))}
      {decouplingCapacitors.map(({ name, pin }) => (
        <Fragment key={`${name}_P`}>
          <trace from={`.U1 > .${pin}`} to={`.${name} > .pin1`} />
        </Fragment>
      ))}
      {decouplingCapacitors.map(({ name }) => (
        <Fragment key={`${name}_G`}>
          <trace from={`.${name} > .pin2`} to="net.GND" />
        </Fragment>
      ))}
      <trace from=".U1 > .GND" to="net.GND" />
    </>
  )

  circuit.add(
    <board
      width="90mm"
      height="60mm"
      layers={2}
      autorouter="auto"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
    >
      {runFlatComparison ? (
        rp2040Core
      ) : (
        <subcircuit name="RP2040_CORE" autorouter="auto">
          {rp2040Core}
        </subcircuit>
      )}

      {gpioBanks.map(({ name, footprint, pcbX, pcbY, pcbRotation, pins }) => (
        <chip
          key={name}
          name={name}
          footprint={footprint}
          pcbX={pcbX}
          pcbY={pcbY}
          pcbRotation={pcbRotation}
          pinLabels={Object.fromEntries(
            pins.map((pin, pinIndex) => [`pin${pinIndex + 1}`, pin]),
          )}
        />
      ))}
      {gpioBanks.flatMap(({ name, pins }) =>
        pins.map((pin) => (
          <Fragment key={`${name}_${pin}`}>
            <trace
              name={`${name}_${pin}`}
              from={`.${name} > .${pin}`}
              to={`${rp2040Selector} > .${pin}`}
            />
          </Fragment>
        )),
      )}

      <chip
        name="U_FLASH"
        footprint="soic8"
        pcbX={21}
        pcbY={18}
        pinLabels={{
          pin1: "QSPI_SS",
          pin2: "QSPI_SD1",
          pin3: "QSPI_SD2",
          pin4: "GND",
          pin5: "QSPI_SD0",
          pin6: "QSPI_SCLK",
          pin7: "QSPI_SD3",
          pin8: "VCC",
        }}
      />
      {[
        "QSPI_SS",
        "QSPI_SD1",
        "QSPI_SD2",
        "QSPI_SD0",
        "QSPI_SCLK",
        "QSPI_SD3",
      ].map((pin) => (
        <Fragment key={pin}>
          <trace
            name={`FLASH_${pin}`}
            from={`.U_FLASH > .${pin}`}
            to={`${rp2040Selector} > .${pin}`}
          />
        </Fragment>
      ))}
      <trace
        name="FLASH_VCC"
        from=".U_FLASH > .VCC"
        to={`${rp2040Selector} > .IOVDD1`}
      />

      <chip
        name="U_DEBUG_USB"
        footprint="soic8"
        pcbX={29}
        pcbY={-17}
        pcbRotation={90}
        pinLabels={{
          pin1: "GPIO28_ADC2",
          pin2: "GPIO29_ADC3",
          pin3: "USB_DM",
          pin4: "USB_DP",
          pin5: "SWCLK",
          pin6: "SWD",
          pin7: "RUN",
          pin8: "TEST",
        }}
      />
      {["GPIO28_ADC2", "GPIO29_ADC3", "SWCLK", "SWD", "RUN"].map((pin) => (
        <Fragment key={pin}>
          <trace
            name={`DEBUG_${pin}`}
            from={`.U_DEBUG_USB > .${pin}`}
            to={`${rp2040Selector} > .${pin}`}
          />
        </Fragment>
      ))}

      <resistor
        name="R_USB_DM"
        resistance="27"
        footprint="0603"
        pcbX={13}
        pcbY={-13}
      />
      <resistor
        name="R_USB_DP"
        resistance="27"
        footprint="0603"
        pcbX={16}
        pcbY={-15}
      />
      <trace from={`${rp2040Selector} > .USB_DM`} to=".R_USB_DM > .pin1" />
      <trace from=".R_USB_DM > .pin2" to=".U_DEBUG_USB > .USB_DM" />
      <trace from={`${rp2040Selector} > .USB_DP`} to=".R_USB_DP > .pin1" />
      <trace from=".R_USB_DP > .pin2" to=".U_DEBUG_USB > .USB_DP" />

      <resistor
        name="Y1"
        resistance="1M"
        footprint="0805"
        pcbX={-13}
        pcbY={-12}
      />
      <trace from={`${rp2040Selector} > .XIN`} to=".Y1 > .pin1" />
      <trace from={`${rp2040Selector} > .XOUT`} to=".Y1 > .pin2" />

      <transistor
        name="Q_REG"
        type="npn"
        footprint="sot23"
        pcbX={0}
        pcbY={-19}
      />
      <trace from={`${rp2040Selector} > .VREG_IN`} to=".Q_REG > .base" />
      <trace from={`${rp2040Selector} > .VREG_VOUT`} to=".Q_REG > .collector" />

      <pcbnotetext
        pcbX={0}
        pcbY={28}
        fontSize={0.8}
        text="RP2040 + 10 decouplers in subcircuit; mixed footprints outside"
      />
    </board>,
  )

  const renderStartedAt = performance.now()
  await circuit.renderUntilSettled()
  const renderDurationMs = performance.now() - renderStartedAt

  if (runFlatComparison) {
    expect(autoroutingPhaseIoStack).toHaveLength(1)
    expect(
      autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.connections,
    ).toHaveLength(59)
    console.log(`Flat RP2040 autorouting took ${renderDurationMs.toFixed(0)}ms`)
    return
  }

  expect(autoroutingPhaseIoStack).toHaveLength(2)
  const [subcircuitPhase, boardPhase] = autoroutingPhaseIoStack
  expect(subcircuitPhase?.startSimpleRouteJson?.connections).toHaveLength(11)
  expect(subcircuitPhase?.endSimpleRouteJson?.traces).toHaveLength(20)
  expect(boardPhase?.startSimpleRouteJson?.connections).toHaveLength(48)
  expect(boardPhase?.startSimpleRouteJson?.traces).toBeUndefined()

  const boardInputSrj = boardPhase!.startSimpleRouteJson!
  const boardConnectionPoints = boardInputSrj.connections.flatMap(
    (connection) => connection.pointsToConnect,
  )
  const rp2040SourceComponent = circuit.db.source_component.getWhere({
    name: "U1",
  })
  const rp2040SourcePortIds = new Set(
    circuit.db.source_port
      .list()
      .filter(
        (sourcePort) =>
          sourcePort.source_component_id ===
          rp2040SourceComponent?.source_component_id,
      )
      .map((sourcePort) => sourcePort.source_port_id),
  )
  const rp2040PcbPortIds = new Set(
    circuit.db.pcb_port
      .list()
      .filter((pcbPort) => rp2040SourcePortIds.has(pcbPort.source_port_id))
      .map((pcbPort) => pcbPort.pcb_port_id),
  )
  const rp2040ConnectionPoints = boardConnectionPoints.filter(
    (point) => point.pcb_port_id && rp2040PcbPortIds.has(point.pcb_port_id),
  )
  expect(boardConnectionPoints.length).toBeGreaterThan(96)
  expect(rp2040ConnectionPoints).toHaveLength(46)
  expect(
    rp2040ConnectionPoints.every(
      (point) =>
        point.pcb_port_id &&
        point.pointId === point.pcb_port_id &&
        Math.abs(point.x) < 4 &&
        Math.abs(point.y) < 4,
    ),
  ).toBe(true)
  expect(
    boardConnectionPoints.some((point) =>
      point.pointId?.startsWith("pcb_breakout_point_"),
    ),
  ).toBe(false)
  expect(
    boardConnectionPoints.every((point) => point.port_selector === undefined),
  ).toBe(true)
  expect(
    boardConnectionPoints.every(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        point.x >= boardInputSrj.bounds.minX &&
        point.x <= boardInputSrj.bounds.maxX &&
        point.y >= boardInputSrj.bounds.minY &&
        point.y <= boardInputSrj.bounds.maxY,
    ),
  ).toBe(true)
  expect(new Set(boardInputSrj.connections.map(({ name }) => name)).size).toBe(
    48,
  )
  const childTraceIds = new Set(
    subcircuitPhase?.endSimpleRouteJson?.traces?.map(
      ({ pcb_trace_id }) => pcb_trace_id,
    ),
  )
  const childTraceObstacles = boardInputSrj.obstacles.filter((obstacle) =>
    Array.from(childTraceIds).some((pcbTraceId) =>
      obstacle.obstacleId?.startsWith(`${pcbTraceId}_`),
    ),
  )
  expect(childTraceObstacles.length).toBeGreaterThanOrEqual(childTraceIds.size)

  const childTraceConnectionPoints = boardConnectionPoints.filter((point) =>
    point.pointId?.startsWith("pcb_trace_route_point_"),
  )
  expect(childTraceConnectionPoints.length).toBeGreaterThan(2)
  const childTraceObstacleConnectedIds = new Set(
    childTraceObstacles.flatMap((obstacle) => obstacle.connectedTo),
  )
  expect(
    childTraceConnectionPoints.every(
      (point) =>
        point.pointId && childTraceObstacleConnectedIds.has(point.pointId),
    ),
  ).toBe(true)
  const childTraceAttachmentConnections = boardInputSrj.connections.filter(
    (connection) =>
      connection.pointsToConnect.some((point) =>
        point.pointId?.startsWith("pcb_trace_route_point_"),
      ),
  )
  expect(childTraceAttachmentConnections).toHaveLength(1)
  const alreadyConnectedAttachmentPointIds = new Set(
    childTraceAttachmentConnections[0]?.externallyConnectedPointIds?.flat(),
  )
  expect(
    childTraceConnectionPoints.every(
      (point) =>
        point.pointId && alreadyConnectedAttachmentPointIds.has(point.pointId),
    ),
  ).toBe(true)

  const routedParentTraces = boardPhase?.endSimpleRouteJson?.traces ?? []
  expect(routedParentTraces).toHaveLength(48)
  expect(
    new Set(routedParentTraces.map((trace) => trace.connection_name)),
  ).toEqual(
    new Set(boardInputSrj.connections.map((connection) => connection.name)),
  )
  expect(routedParentTraces.every((trace) => trace.route.length > 1)).toBe(true)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  console.log(
    `RP2040 subcircuit autorouting took ${renderDurationMs.toFixed(0)}ms`,
  )
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "repro-rp2040-subcircuit-autorouting-slowdown-srj",
    circuit,
    { diffThresholdPercent: 1 },
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 2,
  })
}, 600_000)
