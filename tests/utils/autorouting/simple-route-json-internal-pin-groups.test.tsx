import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internal pin groups stay separate from unrouted pads on the same net", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={12} routingDisabled>
      <chip
        name="U1"
        pcbX={-3}
        footprint="soic8"
        pinLabels={{
          pin1: "A",
          pin2: "B",
          pin3: "C",
          pin4: "D",
          pin5: "E",
          pin6: "F",
        }}
        internallyConnectedPins={[
          ["A", "B"],
          ["B", "C"],
          ["D", "E"],
        ]}
        connections={{
          A: "net.SIGNAL",
          C: "net.SIGNAL",
          D: "net.SIGNAL",
          E: "net.SIGNAL",
          F: "net.SIGNAL",
        }}
      />
      <resistor
        name="R1"
        pcbX={5}
        footprint="0402"
        resistance="1k"
        connections={{ pin1: "net.SIGNAL" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  const signal = simpleRouteJson.connections.find((connection) =>
    connection.pointsToConnect.some((point) => point.port_selector === "U1.A"),
  )!
  // B links A to C inside the chip even though B has no external trace.
  // D/E form a separate internal group. F and R1 still require routing.
  expect(signal.externallyConnectedPointIds).toEqual([
    [
      circuit.firstChild!.selectOne<Port>(".U1 > .A")!.pcb_port_id!,
      circuit.firstChild!.selectOne<Port>(".U1 > .C")!.pcb_port_id!,
    ],
    [
      circuit.firstChild!.selectOne<Port>(".U1 > .D")!.pcb_port_id!,
      circuit.firstChild!.selectOne<Port>(".U1 > .E")!.pcb_port_id!,
    ],
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
  })
})
