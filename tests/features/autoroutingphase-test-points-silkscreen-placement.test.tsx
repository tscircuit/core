import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

test("generated test point labels move to the first clear position around the pad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (srj) =>
          srj.connections.map((c) => ({
            type: "pcb_trace",
            pcb_trace_id: c.name,
            connection_name: c.source_trace_id ?? c.name,
            route: c.pointsToConnect.map((p) => ({
              route_type: "wire",
              x: p.x,
              y: p.y,
              layer: p.layer,
              width: 0.2,
            })),
          })),
        ),
      }}
    >
      <testpoint name="LEFT" pcbX={-7} padDiameter={1} />
      <testpoint name="RIGHT" pcbX={7} padDiameter={1} />
      <trace name="PROBE" from="LEFT.pin1" to="RIGHT.pin1" />
      {/* Occupies the default position above the generated pad */}
      <silkscreentext text="KEEP OUT" pcbX={0} pcbY={1} fontSize={0.6} />
      <autoroutingphase
        reroute
        connection="LEFT.pin1"
        addTestPoints
        testPointLayer="top"
        testPointMaxDetour={0}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pad = circuit.db.pcb_smtpad
    .list()
    .find((smtpad) => smtpad.shape === "circle")
  if (pad?.shape !== "circle") throw new Error("No generated test point pad")
  expect(pad.x).toBeCloseTo(0)
  const label = circuit.db.pcb_silkscreen_text.getWhere({ text: "PROBE" })!
  expect(label.anchor_position.x).toBeCloseTo(pad.x)
  expect(label.anchor_position.y).toBeLessThan(pad.y)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
