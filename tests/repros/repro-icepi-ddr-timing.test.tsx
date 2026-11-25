import { expect, test } from "bun:test"
import { PcbConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Port } from "lib/components/primitive-components/Port/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { IcePiDdrBoard, icePiDdrSource } from "tests/fixtures/icepi/ddr-board"

test("iCE/Pi CM0 SBC end-to-end DDR routing and timing", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<IcePiDdrBoard />)
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 1000,
    viewport: { minX: 2, maxX: 32, minY: -9, maxY: 23 },
    shouldDrawRatsNest: circuit.db.pcb_trace.list().length === 0,
    showDebugObjects: false,
  })
  expect(circuit.db.source_net.list()).toHaveLength(50)
  expect(circuit.db.source_bus.list()).toHaveLength(18)
  const circuitJson = circuit.getCircuitJson()
  const pcbConnectivity = new PcbConnectivityMap(circuitJson).connMap
  for (const signal of icePiDdrSource.traces) {
    const pcbPortIds = signal.path.map(
      (selector) => circuit.firstChild!.selectOne<Port>(selector)!.pcb_port_id!,
    )
    expect(
      pcbConnectivity.areAllIdsConnected(pcbPortIds),
      signal.nativeNet,
    ).toBe(true)
  }
  expect(
    circuitJson.filter(
      (element) =>
        element.type.endsWith("_error") ||
        element.type === "pcb_bus_routing_constraint_warning",
    ),
  ).toEqual([])
}, 300_000)
