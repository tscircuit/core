import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath connects consecutive vias with wire on each layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={4} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[
          { x: 1, y: 1, via: true, fromLayer: "top", toLayer: "bottom" },
          { x: 5, y: 1, via: true, fromLayer: "bottom", toLayer: "top" },
        ]}
      />
      <silkscreentext
        pcbY={-2.5}
        anchorAlignment="center"
        fontSize={0.5}
        text="BOTTOM COPPER BETWEEN VIAS"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  if (!pcbTrace) throw new Error("Expected the manual PCB trace to render")

  expect(pcbTrace.route.map((point) => point.route_type)).toEqual([
    "wire",
    "wire",
    "via",
    "wire",
    "wire",
    "via",
    "wire",
    "wire",
  ])

  for (let routeIndex = 0; routeIndex < pcbTrace.route.length; routeIndex++) {
    const viaPoint = pcbTrace.route[routeIndex]
    if (viaPoint?.route_type !== "via") continue

    const precedingPoint = pcbTrace.route[routeIndex - 1]
    const followingPoint = pcbTrace.route[routeIndex + 1]
    expect(precedingPoint).toMatchObject({
      route_type: "wire",
      x: viaPoint.x,
      y: viaPoint.y,
      layer: viaPoint.from_layer,
    })
    expect(followingPoint).toMatchObject({
      route_type: "wire",
      x: viaPoint.x,
      y: viaPoint.y,
      layer: viaPoint.to_layer,
    })
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
