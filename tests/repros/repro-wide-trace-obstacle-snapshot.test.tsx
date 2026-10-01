import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting avoids the full width of a printed copper link", async () => {
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
            <pcbtrace
              route={[
                { route_type: "wire", x: -2, y: 0, width: 2, layer: "top" },
                { route_type: "wire", x: 2, y: 0, width: 2, layer: "top" },
              ]}
            />
          </footprint>
        }
      />
      <trace from="R1.pin2" to="R2.pin1" />
      <fabricationnotetext
        text="R1-R2 must not touch the printed R3 copper link"
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
        text="Expected: a visible gap between R1-R2 and R3"
        pcbY={-3.5}
        fontSize={0.4}
        color="#ffffff"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Capture the actual routing before checking it, so the broken version
  // produces a useful snapshot too. No drawn obstacle substitutes for copper.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(
    checkEachPcbTraceNonOverlapping(circuit.getCircuitJson(), {
      minClearance: 0,
    }),
  ).toEqual([])
})
