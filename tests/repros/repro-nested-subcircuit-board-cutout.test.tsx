import { expect, test } from "bun:test"
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
      width: 4,
      height: 8,
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
    // Route points are circuit-world points in mm (+X right, +Y up).
    // Clip each copper segment against the slot interior, excluding contact
    // with its boundary. Checking endpoints alone misses a straight crossing.
    let lower = 0
    let upper = 1
    for (const [axis, min, max] of [
      ["x", -2 + 1e-6, 2 - 1e-6],
      ["y", -4 + 1e-6, 4 - 1e-6],
    ] as const) {
      const delta = b[axis] - a[axis]
      if (delta === 0) {
        if (a[axis] < min || a[axis] > max) upper = -1
        continue
      }
      const first = (min - a[axis]) / delta
      const second = (max - a[axis]) / delta
      lower = Math.max(lower, Math.min(first, second))
      upper = Math.min(upper, Math.max(first, second))
    }
    expect(lower < upper).toBe(false)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
