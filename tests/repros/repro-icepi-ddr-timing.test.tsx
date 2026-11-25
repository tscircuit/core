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
    backgroundColor: "white",
    shouldDrawRatsNest: true,
    showDebugObjects: false,
  })
  expect(circuit.db.source_net.list()).toHaveLength(50)
  expect(circuit.db.source_bus.list()).toHaveLength(18)
  const pcbConnectivity = new PcbConnectivityMap(circuit.getCircuitJson())
    .connMap
  for (const signal of icePiDdrSource.traces) {
    const pcbPortIds = signal.path.map(
      (selector) => circuit.firstChild!.selectOne<Port>(selector)!.pcb_port_id!,
    )
    expect(
      pcbConnectivity.areAllIdsConnected(pcbPortIds),
      signal.nativeNet,
    ).toBe(false)
  }
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_bus_routing_constraint_warning.list()).toHaveLength(8)
}, 300_000)
