import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace shorthand follows its footprint pads on both sides at every quarter turn", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={56} height={30} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [0, 90, 180, 270].map((rotation, column) => (
          <chip
            key={`${layer}-${rotation}`}
            name={`${layer === "top" ? "T" : "B"}${rotation}`}
            pcbX={column * 12 - 18}
            pcbY={row === 0 ? 6 : -6}
            pcbRotation={rotation}
            layer={layer}
            internallyConnectedPins={[["pin1", "pin2"]]}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  pcbX={-3}
                  pcbY={-1}
                  width={1}
                  height={1}
                  shape="rect"
                  layer="top"
                />
                <smtpad
                  portHints={["pin2"]}
                  pcbX={2}
                  pcbY={1}
                  width={1}
                  height={1}
                  shape="rect"
                  layer="top"
                />
                <pcbtrace
                  thickness="0.25mm"
                  route={[
                    { x: "-3mm", y: "-1mm" },
                    { x: "2mm", y: "1mm" },
                  ]}
                />
              </footprint>
            }
          />
        )),
      )}
      {["TOP", "BOTTOM"].flatMap((side, row) =>
        [0, 90, 180, 270].map((rotation, column) => (
          <Fragment key={`${side}-${rotation}`}>
            <pcbnotetext
              text={`${side}: ${rotation}deg`}
              pcbX={column * 12 - 18}
              pcbY={row === 0 ? 12 : -12}
              fontSize={0.7}
              layer="top"
            />
          </Fragment>
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(8)
  for (const trace of traces) {
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "rect")
      .filter((pad) => pad.pcb_component_id === trace.pcb_component_id)
    const wires = trace.route.filter((point) => point.route_type === "wire")
    expect(wires).toHaveLength(2)
    for (const [pinIndex, wire] of wires.entries()) {
      const pad = pads.find((pad) =>
        pad.port_hints?.includes(`pin${pinIndex + 1}`),
      )!
      expect(wire.x).toBeCloseTo(pad.x, 8)
      expect(wire.y).toBeCloseTo(pad.y, 8)
      expect(wire.layer).toBe(pad.layer)
      expect(wire.width).toBe(0.25)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })
})
