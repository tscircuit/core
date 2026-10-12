import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("routed trace attribution respects rotated pad geometry on both layers", async () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270, 45]
  const layers = ["top", "bottom"] as const

  circuit.add(
    <board width={40} height={20} routingDisabled schematicDisabled>
      {layers.flatMap((layer) =>
        rotations.map((rotation, column) => {
          const name = `U_${layer}_${rotation}`
          return (
            <chip
              key={name}
              name={name}
              layer={layer}
              pcbX={-16 + column * 8}
              pcbY={layer === "top" ? 4 : -4}
              pcbRotation={rotation}
              pinLabels={{
                pin1: ["ADJACENT"],
                pin2: ["SIGNAL"],
                pin3: ["OUT"],
              }}
              connections={{
                pin1: `net.ADJACENT_${layer}_${rotation}`,
                pin2: `${name}.OUT`,
              }}
              footprint={
                <footprint>
                  <smtpad
                    shape="rotated_rect"
                    width={1.3}
                    height={0.3}
                    ccwRotation={0}
                    pcbY={0.5}
                    portHints={["pin1"]}
                  />
                  <smtpad
                    shape="rotated_rect"
                    width={1.3}
                    height={0.3}
                    ccwRotation={0}
                    portHints={["pin2"]}
                  />
                  <smtpad
                    shape="rotated_rect"
                    width={1.3}
                    height={0.3}
                    ccwRotation={0}
                    pcbX={3}
                    portHints={["pin3"]}
                  />
                </footprint>
              }
            />
          )
        }),
      )}
      <fabricationnotetext
        text="Trace attribution: 0, 90, 180, 270, 45 degrees"
        pcbY={8}
        fontSize={0.6}
      />
      <fabricationnotetext
        text="Top / bottom: SIGNAL connects to OUT, never ADJACENT"
        pcbY={-8}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const db = circuit.db

  for (const layer of layers) {
    for (const rotation of rotations) {
      const name = `U_${layer}_${rotation}`
      const sourceComponent = db.source_component
        .list()
        .find((sourceComponent) => sourceComponent.name === name)!
      const signalPort = db.source_port
        .list()
        .find(
          (sourcePort) =>
            sourcePort.source_component_id ===
              sourceComponent.source_component_id &&
            sourcePort.name === "SIGNAL",
        )!
      const signalSourceTrace = db.source_trace
        .list()
        .find((sourceTrace) =>
          sourceTrace.connected_source_port_ids.includes(
            signalPort.source_port_id,
          ),
        )!
      const signalPads = db.pcb_smtpad.list().filter((pad) => {
        const sourcePortId = pad.pcb_port_id
          ? db.pcb_port.get(pad.pcb_port_id)?.source_port_id
          : undefined
        return (
          sourcePortId &&
          signalSourceTrace.connected_source_port_ids.includes(sourcePortId)
        )
      })
      expect(signalPads).toHaveLength(2)

      // Use the emitted pad geometry, including bottom-layer mirroring. Check
      // centers, off-center copper, and trace-width overlap beyond the pad edge.
      for (const endpointPosition of ["center", "inside", "overlap"] as const) {
        const route = signalPads.map((pad) => {
          if (pad.shape !== "rotated_rect")
            throw new Error("Expected rotated pad")
          const localX =
            endpointPosition === "center"
              ? 0
              : endpointPosition === "inside"
                ? pad.width * 0.4
                : pad.width / 2 + 0.01
          const endpoint = applyToPoint(
            compose(translate(pad.x, pad.y), rotateDEG(pad.ccw_rotation)),
            { x: localX, y: 0 },
          )
          return {
            route_type: "wire" as const,
            ...endpoint,
            width: 0.04,
            layer: pad.layer,
          }
        })
        // No port IDs: attribution must recover the source from endpoint copper.
        const routedTrace = {
          type: "pcb_trace" as const,
          pcb_trace_id: `routed_${name}_${endpointPosition}`,
          route,
        }
        const sourceTraceId = getSourceTraceIdForRoutedTrace({
          db,
          trace: routedTrace,
        })
        expect(sourceTraceId).toBe(signalSourceTrace.source_trace_id)

        if (endpointPosition === "inside") {
          db.pcb_trace.insert({
            ...routedTrace,
            source_trace_id: sourceTraceId,
          })
        }
      }
    }
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
  })
})
