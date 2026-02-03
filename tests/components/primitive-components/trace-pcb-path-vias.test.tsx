import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace pcbPath supports vias with inner layer transitions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" layers={4}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[
          { x: 1, y: 0, via: true, fromLayer: "top", toLayer: "inner1" },
          { x: 3, y: 0 },
          { x: 5, y: 0, via: true, fromLayer: "inner1", toLayer: "inner2" },
          { x: 7, y: 0 },
          { x: 9, y: 0, via: true, fromLayer: "inner2", toLayer: "top" },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeTruthy()
  const route = pcbTrace.route
  const viaPoints = route.filter((point) => point.route_type === "via")
  expect(viaPoints).toHaveLength(3)
  expect(viaPoints[0]).toMatchObject({
    from_layer: "top",
    to_layer: "inner1",
  })
  expect(viaPoints[1]).toMatchObject({
    from_layer: "inner1",
    to_layer: "inner2",
  })
  expect(viaPoints[2]).toMatchObject({
    from_layer: "inner2",
    to_layer: "top",
  })

  const firstViaIndex = route.findIndex((point) => point.route_type === "via")
  const secondViaIndex = route.findIndex(
    (point, index) => index > firstViaIndex && point.route_type === "via",
  )
  const thirdViaIndex = route.findIndex(
    (point, index) => index > secondViaIndex && point.route_type === "via",
  )

  expect(route[firstViaIndex + 1]).toMatchObject({
    route_type: "wire",
    layer: "inner1",
  })
  expect(route[secondViaIndex + 1]).toMatchObject({
    route_type: "wire",
    layer: "inner2",
  })
  expect(route[thirdViaIndex + 1]).toMatchObject({
    route_type: "wire",
    layer: "top",
  })
})
