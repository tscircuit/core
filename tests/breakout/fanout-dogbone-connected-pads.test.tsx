import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone fans out only connected pads of a 36-pin footprinter BGA", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={14}
      height={12}
      layers={4}
      routeRemaining={false}
      minTraceWidth={0.1}
      minViaPadDiameter={0.4}
      minViaHoleDiameter={0.15}
    >
      <fanout autorouter="dogbone" fanoutRoutingLayers={["inner2"]}>
        <chip
          name="U1"
          footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
          connections={{
            pin1: "net.DATA0",
            pin6: "net.DATA1",
            pin8: "net.VCC",
            pin15: "net.GND",
            pin22: "net.CLOCK",
            pin29: "net.ENABLE",
            pin31: "net.DATA2",
            pin36: "net.DATA3",
          }}
        />
      </fanout>
      <pcbnotetext
        pcbY={4.5}
        text="36 pads: 8 connected dogbones, 28 untouched"
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(36)
  expect(circuit.db.pcb_trace.list()).toHaveLength(8)
  expect(circuit.db.pcb_via.list()).toHaveLength(8)
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(8)
  const connectedPins = new Set([1, 6, 8, 15, 22, 29, 31, 36])
  for (let pin = 1; pin <= 36; pin++) {
    const port = circuit.selectOne(`U1.${pin}`, { type: "port" }) as Port
    const pcbPort = circuit.db.pcb_port.get(port.pcb_port_id!)!
    const traces = circuit.db.pcb_trace
      .list()
      .filter((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            point.layer === "top" &&
            Math.hypot(point.x - pcbPort.x, point.y - pcbPort.y) < 1e-6,
        ),
      )
    expect(traces).toHaveLength(connectedPins.has(pin) ? 1 : 0)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 20_000)
