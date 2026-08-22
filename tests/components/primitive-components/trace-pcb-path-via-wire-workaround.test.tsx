import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath reuses explicit wire points around vias", async () => {
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
          { x: 1, y: 1 },
          { x: 1, y: 1, via: true, fromLayer: "top", toLayer: "bottom" },
          { x: 1, y: 1 },
          { x: 5, y: 1 },
          { x: 5, y: 1, via: true, fromLayer: "bottom", toLayer: "top" },
          { x: 5, y: 1 },
        ]}
      />
      <silkscreentext
        pcbY={-2.5}
        anchorAlignment="center"
        fontSize={0.5}
        text="EXPLICIT VIA WIRES STAY DEDUPED"
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

  for (let routeIndex = 1; routeIndex < pcbTrace.route.length; routeIndex++) {
    const precedingPoint = pcbTrace.route[routeIndex - 1]
    const point = pcbTrace.route[routeIndex]
    if (
      precedingPoint?.route_type !== "wire" ||
      point?.route_type !== "wire" ||
      precedingPoint.layer !== point.layer
    ) {
      continue
    }

    expect({ x: point.x, y: point.y }).not.toEqual({
      x: precedingPoint.x,
      y: precedingPoint.y,
    })
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
