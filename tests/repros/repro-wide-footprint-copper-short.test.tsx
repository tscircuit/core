import { expect, test } from "bun:test"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points in mm, +X right, +Y up, right-handed.
const copperLinkRoute = [
  { route_type: "wire", x: -2, y: 0, width: 2, layer: "top" },
  { route_type: "wire", x: 2, y: 0, width: 2, layer: "top" },
] satisfies PcbTraceRoutePoint[]

test("autorouter shorts through a wide printed copper link", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} autorouter="auto_local">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={0.4}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        pcbY={0.4}
      />
      {/* A printed zero-ohm link: footprint-local points in mm,
          +X right, +Y up, right-handed. No assembly part is needed. */}
      <resistor
        name="R3"
        resistance="0"
        doNotPlace
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2}
              width={1}
              height={1}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={2}
              width={1}
              height={1}
              shape="rect"
            />
            <pcbtrace route={copperLinkRoute} />
          </footprint>
        }
      />
      <trace from="R1.pin2" to="R2.pin1" />
      <fabricationnotetext
        text="BUG: R1-R2 touches the separate R3 copper link"
        pcbY={3.8}
        fontSize={0.45}
        color="#ffffff"
      />
      <fabricationnotetext
        text="All copper is on TOP; R3 is a separate connection"
        pcbY={2.9}
        fontSize={0.4}
        color="#ffffff"
      />
      {/* Board-world points in mm, +X right, +Y up. */}
      <fabricationnotedimension
        from={{ x: 0, y: -1 }}
        to={{ x: 0, y: 1 }}
        offset={0}
        text="2 mm"
        fontSize={0.4}
        arrowSize={0.2}
        color="#ffffff"
      />
      <fabricationnotetext
        text="R3: 2 mm-wide printed copper (not a mounted resistor)"
        pcbY={-2.5}
        fontSize={0.4}
        color="#ffffff"
      />
      <fabricationnotetext
        text="Observed: R1-R2 shorts to R3"
        pcbY={-3.5}
        fontSize={0.4}
        color="#ffffff"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // The repro snapshot shows the actual short, with no drawn obstacle
  // substituted for copper. The fix will change this assertion and snapshot.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(
    checkEachPcbTraceNonOverlapping(circuit.getCircuitJson(), {
      minClearance: 0,
    }),
  ).toHaveLength(1)
})
