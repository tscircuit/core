import { expect, test } from "bun:test"
import { segmentToBoxMinDistance } from "@tscircuit/math-utils"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested subcircuit routing avoids a board-owned cutout", async () => {
  const { circuit } = getTestFixture()
  const routingInputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    routingInputs.push(simpleRouteJson)
  })
  circuit.add(
    <board width={24} height={18} autorouter="auto-local" schematicDisabled>
      <group name="Child" subcircuit width={22} height={16}>
        {[-7, 7].map((pcbX, index) => (
          <chip
            key={pcbX}
            name={`J${index + 1}`}
            pcbX={pcbX}
            pinLabels={{ pin1: ["SIGNAL"] }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  shape="rect"
                  width={1}
                  height={1}
                />
                <silkscreentext text={`J${index + 1}.pin1`} pcbY={1.5} />
              </footprint>
            }
          />
        ))}
        <trace from=".J1 > .pin1" to=".J2 > .pin1" />
      </group>
      <cutout shape="rect" width={4} height={8} />
      <pcbnotetext text="Board-owned slot" pcbY={-5.5} fontSize={0.6} />
      <pcbnotetext
        text="Copper must detour around the opening"
        pcbY={-7}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(routingInputs).toHaveLength(1)
  expect(routingInputs[0].obstacles).toContainEqual(
    expect.objectContaining({
      center: { x: 0, y: 0 },
      width: 4.4,
      height: 8.4,
      layers: ["top", "bottom"],
      connectedTo: [],
    }),
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const route = circuit.db.pcb_trace.list()[0].route
  expect(route.length).toBeGreaterThan(1)
  expect(
    route.every(
      (point) => point.route_type === "wire" && point.layer === "top",
    ),
  ).toBe(true)
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]
    const b = route[i]
    if (a.route_type !== "wire" || b.route_type !== "wire") continue
    // Circuit-world mm (+X right, +Y up): measure actual copper, not just
    // centerline avoidance, against the physical slot rather than its keepout.
    const copperClearance =
      segmentToBoxMinDistance(a, b, {
        center: { x: 0, y: 0 },
        width: 4,
        height: 8,
      }) -
      Math.max(a.width, b.width) / 2
    expect(copperClearance).toBeGreaterThanOrEqual(0.2 - 1e-6)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
