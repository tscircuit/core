import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved phase paths follow enclosing group placement on both PCB layers", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const paths: FanoutTracePath[] = [
        {
          connection: "U1.1",
          route: [
            { route_type: "wire", x: -2, y: -1, width: 0.2, layer },
            { route_type: "wire", x: -2, y: 1, width: 0.2, layer },
            { route_type: "wire", x: 4, y: 1, width: 0.2, layer },
          ],
        },
      ]
      circuit.add(
        <board width={24} height={24}>
          <pcbnotetext
            pcbY={9}
            fontSize={0.6}
            text={`Saved route: ${layer}, group rotation ${rotation}`}
          />
          <group
            subcircuit
            name="saved"
            pcbX={3}
            pcbY={2}
            pcbRotation={rotation}
          >
            <chip
              name="U1"
              pcbX={-2}
              pcbY={-1}
              layer={layer}
              pinLabels={{ pin1: "START" }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    width={0.6}
                    height={0.6}
                    shape="rect"
                  />
                </footprint>
              }
            />
            <chip
              name="U2"
              pcbX={4}
              pcbY={1}
              layer={layer}
              pinLabels={{ pin1: "END" }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    width={0.6}
                    height={0.6}
                    shape="rect"
                  />
                </footprint>
              }
            />
            <autoroutingphase pcbTracePaths={paths} />
            <trace from="U1.1" to="U2.1" />
          </group>
        </board>,
      )
      await circuit.renderUntilSettled()
      expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(circuit.db.pcb_trace_error.list()).toEqual([])
      const trace = circuit.db.pcb_trace.list()[0]!
      const ports = circuit.db.pcb_port.list()
      expect(trace.route[0]).toMatchObject({
        x: ports[0]!.x,
        y: ports[0]!.y,
        layer,
      })
      expect(trace.route.at(-1)).toMatchObject({
        x: ports[1]!.x,
        y: ports[1]!.y,
        layer,
      })
      await expect(circuit).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
})
