import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("generated antenna geometry follows rotation and bottom-layer transforms", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="24mm">
      <antenna
        name="ANT1"
        antennaShape="2.4ghz_meandered_inverted_f"
        pcbX={6}
        pcbY={8}
        pcbRotation={90}
        layer="bottom"
      />
      <pcbnotetext
        text="Bottom-layer MIFA rotated 90 degrees"
        pcbX={0}
        pcbY={-9}
        fontSize="0.8mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const generatedTrace = circuit.db.pcb_trace.list()[0]
  expect(generatedTrace.route[0]).toMatchObject({
    x: 6,
    y: 9.7,
    layer: "bottom",
  })
  const lastRoutePoint = generatedTrace.route.at(-1)!
  if (lastRoutePoint.route_type !== "wire") {
    throw new Error("Expected the generated antenna route to end with copper")
  }
  expect(lastRoutePoint.layer).toBe("bottom")
  expect(lastRoutePoint.x).toBeCloseTo(1.1)
  expect(lastRoutePoint.y).toBeCloseTo(-5.3)

  const feedPad = circuit.db.pcb_smtpad
    .list()
    .find((pad) => pad.port_hints?.includes("pin1"))
  expect(feedPad).toMatchObject({ x: 6, y: 8, layer: "bottom" })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
