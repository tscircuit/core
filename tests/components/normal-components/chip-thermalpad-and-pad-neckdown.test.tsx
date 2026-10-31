import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyPadNeckdownToTraceRoute } from "lib/utils/autorouting/apply-pad-neckdown-to-trace-route"
import type { PcbSmtPad, PcbTraceRoutePoint } from "circuit-json"

test("chip with thermalpad footprint binds pin{N+1} to exposed pad without requiring thermalpad in pinLabels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="qfn8_w3mm_h3mm_p0.65mm_pw0.3mm_pl0.5mm_thermalpad1.5mmx1.5mm"
        pinLabels={{
          pin1: "VCC",
          pin2: "OUT1",
          pin3: "OUT2",
          pin4: "GND1",
          pin5: "IN1",
          pin6: "IN2",
          pin7: "EN",
          pin8: "FAULT",
          pin9: "EPAD",
        }}
      />
      <net name="GND" />
      <trace from=".U1 > .EPAD" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const smtPads = circuit.db.pcb_smtpad.list()
  const thermalPad = smtPads.find((pad) =>
    pad.port_hints?.includes("thermalpad"),
  )

  expect(thermalPad).toBeDefined()
  expect(thermalPad?.pcb_port_id).toBeDefined()

  const pcbPort = circuit.db.pcb_port.get(thermalPad!.pcb_port_id!)
  expect(pcbPort).toBeDefined()
  const sourcePort = circuit.db.source_port.get(pcbPort!.source_port_id)
  expect(sourcePort?.pin_number).toBe(9)
})

test("chip with thermalpad footprint binds pin{N+1}: 'GND' to exposed pad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="qfn8_w3mm_h3mm_p0.65mm_pw0.3mm_pl0.5mm_thermalpad1.5mmx1.5mm"
        pinLabels={{
          pin1: "VCC",
          pin2: "OUT1",
          pin3: "OUT2",
          pin4: "GND1",
          pin5: "IN1",
          pin6: "IN2",
          pin7: "EN",
          pin8: "FAULT",
          pin9: "GND",
        }}
      />
      <net name="GND" />
      <trace from=".U1 > .pin9" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const smtPads = circuit.db.pcb_smtpad.list()
  const thermalPad = smtPads.find((pad) =>
    pad.port_hints?.includes("thermalpad"),
  )

  expect(thermalPad).toBeDefined()
  expect(thermalPad?.pcb_port_id).toBeDefined()

  const pcbPort = circuit.db.pcb_port.get(thermalPad!.pcb_port_id!)
  expect(pcbPort).toBeDefined()
  const sourcePort = circuit.db.source_port.get(pcbPort!.source_port_id)
  expect(sourcePort?.pin_number).toBe(9)
})

test("applyPadNeckdownToTraceRoute necks down 0.5mm trace entering fine-pitch 0.25mm QFN pad and restores 0.5mm outside escape zone", () => {
  const qfnPads: PcbSmtPad[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      pcb_port_id: "port_1",
      layer: "top",
      shape: "rect",
      x: 0,
      y: 0,
      width: 0.25,
      height: 0.75,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_2",
      pcb_port_id: "port_2",
      layer: "top",
      shape: "rect",
      x: 0.5,
      y: 0,
      width: 0.25,
      height: 0.75,
    },
  ]

  const route: PcbTraceRoutePoint[] = [
    {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 0.5,
      layer: "top",
      start_pcb_port_id: "port_1",
    },
    {
      route_type: "wire",
      x: 0,
      y: 3,
      width: 0.5,
      layer: "top",
    },
  ]

  const necked = applyPadNeckdownToTraceRoute(route, qfnPads)
  expect(necked.length).toBe(3)
  expect(necked[0]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 0,
    width: 0.25,
    start_pcb_port_id: "port_1",
  })
  // Pad half-height (0.375mm) + maxEscapeDistance (0.5mm) = 0.875mm
  expect(necked[1]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 0.875,
    width: 0.5,
  })
  expect(necked[2]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 3,
    width: 0.5,
  })
})

test("applyPadNeckdownToTraceRoute necks down trace ending at a fine-pitch QFN pad", () => {
  const qfnPads: PcbSmtPad[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      pcb_port_id: "port_1",
      layer: "top",
      shape: "rect",
      x: 0,
      y: 0,
      width: 0.25,
      height: 0.75,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_2",
      pcb_port_id: "port_2",
      layer: "top",
      shape: "rect",
      x: 0.5,
      y: 0,
      width: 0.25,
      height: 0.75,
    },
  ]

  const route: PcbTraceRoutePoint[] = [
    {
      route_type: "wire",
      x: 0,
      y: 3,
      width: 0.5,
      layer: "top",
    },
    {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 0.5,
      layer: "top",
      end_pcb_port_id: "port_1",
    },
  ]

  const necked = applyPadNeckdownToTraceRoute(route, qfnPads)
  expect(necked.length).toBe(3)
  expect(necked[0]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 3,
    width: 0.5,
  })
  expect(necked[1]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 0.875,
    width: 0.25,
  })
  expect(necked[2]).toMatchObject({
    route_type: "wire",
    x: 0,
    y: 0,
    end_pcb_port_id: "port_1",
  })
})
