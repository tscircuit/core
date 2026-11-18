import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

beforeAll(async () => {
  circuit.add(
    <board width="15mm" height="15mm" routingDisabled>
      <chip
        name="BZ1"
        footprint="pinrow4"
        pinLabels={{ pin1: "POS", pin2: "NEG", pin3: "NC1", pin4: "NC2" }}
        pinAttributes={{
          pin3: { doNotConnect: true },
          pin4: { doNotConnect: true },
        }}
        symbol={
          <symbol>
            <schematicpath
              points={[
                { x: -0.4, y: 0.2 },
                { x: 0, y: 0.2 },
                { x: 0.4, y: 0.4 },
                { x: 0.4, y: -0.4 },
                { x: 0, y: -0.2 },
                { x: -0.4, y: -0.2 },
                { x: -0.4, y: 0.2 },
              ]}
              strokeWidth={0.05}
            />
            <schematictext text="BZ1" schX={0} schY={0.7} fontSize={0.18} />
            <port
              name="POS"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0.2}
            />
            <port
              name="NEG"
              pinNumber={2}
              direction="left"
              schX={-0.4}
              schY={-0.2}
            />
          </symbol>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const noConnectPorts = circuit.db.source_port
    .list()
    .filter((port) => port.do_not_connect)
  expect(noConnectPorts.map((port) => port.pin_number)).toEqual([3, 4])
  for (const port of noConnectPorts) {
    const pcbPort = circuit.db.pcb_port
      .list()
      .find((pcbPort) => pcbPort.source_port_id === port.source_port_id)
    expect(pcbPort).toBeDefined()
    expect(circuit.db.pcb_plated_hole.list()).toContainEqual(
      expect.objectContaining({ pcb_port_id: pcbPort!.pcb_port_id }),
    )
  }

  // Keep snapshot failures outside the expected failure.
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})

test.failing(
  "custom symbols omit no-connect pads without schematic terminals",
  () => {
    const schematicPorts = circuit.db.schematic_port.list()
    expect(schematicPorts).toHaveLength(2)
  },
)
