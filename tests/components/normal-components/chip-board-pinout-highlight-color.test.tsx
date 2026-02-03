import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinAttributes highlightColor is passed to pcb_port", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "SDA",
        }}
        pinAttributes={{
          VCC: { includeInBoardPinout: true, highlightColor: "#ff0000" },
          GND: { includeInBoardPinout: true, highlightColor: "#00ff00" },
          SDA: { includeInBoardPinout: true },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const pcbPorts = circuit.db.pcb_port.list()

  // VCC should have red highlight_color
  const vccSourcePort = sourcePorts.find((port) => port.name === "VCC")
  expect(vccSourcePort).toBeTruthy()
  const vccPcbPort = pcbPorts.find(
    (port) => port.source_port_id === vccSourcePort!.source_port_id,
  )
  expect(vccPcbPort).toBeTruthy()
  expect(vccPcbPort?.is_board_pinout).toBe(true)
  expect((vccPcbPort as any)?.highlight_color).toBe("#ff0000")

  // GND should have green highlight_color
  const gndSourcePort = sourcePorts.find((port) => port.name === "GND")
  expect(gndSourcePort).toBeTruthy()
  const gndPcbPort = pcbPorts.find(
    (port) => port.source_port_id === gndSourcePort!.source_port_id,
  )
  expect(gndPcbPort).toBeTruthy()
  expect(gndPcbPort?.is_board_pinout).toBe(true)
  expect((gndPcbPort as any)?.highlight_color).toBe("#00ff00")

  // SDA should not have highlight_color
  const sdaSourcePort = sourcePorts.find((port) => port.name === "SDA")
  expect(sdaSourcePort).toBeTruthy()
  const sdaPcbPort = pcbPorts.find(
    (port) => port.source_port_id === sdaSourcePort!.source_port_id,
  )
  expect(sdaPcbPort).toBeTruthy()
  expect(sdaPcbPort?.is_board_pinout).toBe(true)
  expect((sdaPcbPort as any)?.highlight_color).toBeUndefined()
})
