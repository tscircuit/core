import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routed trace attribution respects rotated pad geometry on both layers", async () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270]
  const layers = ["top", "bottom"] as const
  circuit.add(
    <board width={36} height={20} routingDisabled>
      {layers.flatMap((layer, row) =>
        rotations.map((rotation, column) => {
          const name = `U${row * 4 + column + 1}`
          return (
            <group key={name} pcbX={column * 8 - 12} pcbY={row * 10 - 5}>
              <chip
                name={name}
                layer={layer}
                pcbRotation={rotation}
                pcbX={0}
                pcbY={0}
                pinLabels={{ pin1: "OTHER", pin2: "SIGNAL", pin3: "TARGET" }}
                footprint={
                  <footprint>
                    <smtpad
                      shape="rotated_rect"
                      ccwRotation={0}
                      width={1.324}
                      height={0.308}
                      pcbX={0}
                      pcbY={0}
                      portHints={["pin1"]}
                    />
                    <smtpad
                      shape="rotated_rect"
                      ccwRotation={0}
                      width={1.324}
                      height={0.308}
                      pcbX={0}
                      pcbY={0.65}
                      portHints={["pin2"]}
                    />
                    <smtpad
                      shape="rect"
                      width={0.3}
                      height={0.3}
                      pcbX={0}
                      pcbY={3}
                      portHints={["pin3"]}
                    />
                  </footprint>
                }
              />
              <trace from={`${name}.pin1`} to={`net.OTHER_${name}`} />
              <trace from={`${name}.pin2`} to={`${name}.pin3`} />
              <pcbnotetext
                text={`${name}: ${layer}, ${rotation} deg`}
                pcbX={0}
                pcbY={-3.5}
                fontSize={0.5}
              />
            </group>
          )
        }),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const { db } = circuit
  for (const component of db.source_component.list()) {
    const ports = db.source_port
      .list()
      .filter((p) => p.source_component_id === component.source_component_id)
    const signal = ports.find((p) => p.pin_number === 2)!
    const target = ports.find((p) => p.pin_number === 3)!
    const expected = db.source_trace
      .list()
      .find((t) => t.connected_source_port_ids.includes(signal.source_port_id))!
    const route = [signal, target].map((port) => {
      const pcbPort = db.pcb_port
        .list()
        .find((p) => p.source_port_id === port.source_port_id)!
      return {
        route_type: "wire" as const,
        x: pcbPort.x,
        y: pcbPort.y,
        width: 0.15,
        layer: pcbPort.layers[0],
      }
    })
    const trace = {
      type: "pcb_trace" as const,
      pcb_trace_id: `route_${component.name}`,
      route,
    }
    expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBe(
      expected.source_trace_id,
    )
  }
})
