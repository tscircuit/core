import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board pinout example", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin4: "GND",
        }}
        pinAttributes={{
          VCC: {
            includeInBoardPinout: true,
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbPorts = circuit.db.pcb_port.list()
  const sourcePorts = circuit.db.source_port.list()

  const vccSourcePort = sourcePorts.find((p) => p.name === "VCC")
  expect(vccSourcePort).toBeDefined()

  const vccPcbPort = pcbPorts.find(
    (p) => p.source_port_id === vccSourcePort!.source_port_id,
  )
  expect(vccPcbPort).toBeDefined()
  expect(vccPcbPort!.is_board_pinout).toBe(true)

  const gndSourcePort = sourcePorts.find((p) => p.name === "GND")
  const gndPcbPort = pcbPorts.find(
    (p) => p.source_port_id === gndSourcePort!.source_port_id,
  )
  expect(gndPcbPort).toBeDefined()
  expect(gndPcbPort!.is_board_pinout).toBeUndefined()
})
