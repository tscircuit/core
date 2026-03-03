import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * This test reproduces an issue where a trace between two chips with custom
 * React symbols would fail because the trace connected to a port that didn't
 * have PCB coordinates.
 *
 * The root cause was that when a chip has both:
 * 1. A custom React symbol with port definitions (e.g., <port name="1" pinNumber={1} />)
 * 2. A footprint with portHints (e.g., <platedhole portHints={["1"]} />)
 *
 * Two separate ports were created - one from the symbol and one from the footprint.
 * The symbol's port would get matched to the platedhole and have PCB coordinates,
 * but the footprint's port (named "pin1") would not. When a trace selector like
 * ".U1 > .pin1" was used, it would find the wrong port without coordinates.
 */

const TestSymbol = () => (
  <symbol name="TestSymbol" width={4} height={4}>
    <schematicpath
      strokeWidth={0.05}
      points={[
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: -1, y: -1 },
      ]}
    />
    <port
      name="1"
      pinNumber={1}
      direction="right"
      schStemLength={0.5}
      schX={2}
      schY={0}
    />
  </symbol>
)

test("repro96: trace between chips with custom symbol should have coordinates", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10}>
      <chip
        name="U1"
        pcbX={-2}
        pcbY={0}
        symbol={<TestSymbol />}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              pcbX="0mm"
              pcbY="0mm"
              outerDiameter="1.5mm"
              holeDiameter="1mm"
              shape="circle"
            />
          </footprint>
        }
      />

      <chip
        name="U2"
        pcbX={2}
        pcbY={0}
        symbol={<TestSymbol />}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              pcbX="0mm"
              pcbY="0mm"
              outerDiameter="1.5mm"
              holeDiameter="1mm"
              shape="circle"
            />
          </footprint>
        }
      />

      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify that both ports have PCB coordinates
  const db = circuit.db
  const sourceTrace = db.source_trace.list()[0]
  expect(sourceTrace).toBeDefined()

  for (const portId of sourceTrace.connected_source_port_ids) {
    const pcbPort = db.pcb_port.getWhere({ source_port_id: portId })
    expect(pcbPort).toBeDefined()
    expect(pcbPort?.x).toBeDefined()
    expect(pcbPort?.y).toBeDefined()
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
