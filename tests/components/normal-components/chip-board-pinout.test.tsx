import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinAttributes includeInBoardPinout marks pcb_port", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
        }}
        pinAttributes={{
          VCC: { includeInBoardPinout: true },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const pcbPorts = circuit.db.pcb_port.list()

  const vccSourcePort = sourcePorts.find((port) => port.name === "VCC")
  expect(vccSourcePort).toBeTruthy()

  const vccPcbPort = pcbPorts.find(
    (port) => port.source_port_id === vccSourcePort!.source_port_id,
  )
  expect(vccPcbPort).toBeTruthy()
  expect(vccPcbPort?.is_board_pinout).toBe(true)

  const gndSourcePort = sourcePorts.find((port) => port.name === "GND")
  expect(gndSourcePort).toBeTruthy()

  const gndPcbPort = pcbPorts.find(
    (port) => port.source_port_id === gndSourcePort!.source_port_id,
  )
  expect(gndPcbPort).toBeTruthy()
  expect(gndPcbPort?.is_board_pinout).not.toBe(true)
})
