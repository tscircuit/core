import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinAttributes highlightColor passes to pcb_port", async () => {
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
          VCC: { highlightColor: "#ff0000", includeInBoardPinout: true },
          GND: { highlightColor: "#00ff00", includeInBoardPinout: true },
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
  expect(vccPcbPort?.highlight_color).toBe("#ff0000")

  const gndSourcePort = sourcePorts.find((port) => port.name === "GND")
  expect(gndSourcePort).toBeTruthy()

  const gndPcbPort = pcbPorts.find(
    (port) => port.source_port_id === gndSourcePort!.source_port_id,
  )
  expect(gndPcbPort).toBeTruthy()
  expect(gndPcbPort?.highlight_color).toBe("#00ff00")

  const sdaSourcePort = sourcePorts.find((port) => port.name === "SDA")
  expect(sdaSourcePort).toBeTruthy()

  const sdaPcbPort = pcbPorts.find(
    (port) => port.source_port_id === sdaSourcePort!.source_port_id,
  )
  expect(sdaPcbPort).toBeTruthy()
  expect(sdaPcbPort?.highlight_color).toBeUndefined()
})
