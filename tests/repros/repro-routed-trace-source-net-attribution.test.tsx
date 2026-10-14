import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-routed traces keep their source net attribution", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} pcbY={0} />
      <trace from="R1.pin1" to="net.USB_N" />
      <trace from="R2.pin1" to="net.USB_P" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const usbPSourceNet = circuit.db.source_net.getWhere({ name: "USB_P" })!
  const usbPSourceTrace = circuit.db.source_trace
    .list()
    .find((sourceTrace) =>
      sourceTrace.connected_source_net_ids.includes(
        usbPSourceNet.source_net_id,
      ),
    )!
  const r1PcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: circuit.db.source_port.getWhere({
      source_component_id: circuit.db.source_component.getWhere({ name: "R1" })!
        .source_component_id,
      name: "pin1",
    })!.source_port_id,
  })!

  const routedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "synthetic_usb_p_route",
    connection_name: usbPSourceNet.source_net_id,
    route: [
      {
        route_type: "wire",
        x: r1PcbPort.x,
        y: r1PcbPort.y,
        width: 0.15,
        layer: "top",
      },
    ],
  }

  expect(
    getSourceTraceIdForRoutedTrace({
      db: circuit.db,
      trace: routedTrace,
    }),
  ).toBe(usbPSourceTrace.source_trace_id)
})
